import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "../config.js";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function generateOutline(title, notes) {
    const prompt = `
    You are a professional book editor. Create a detailed book outline for the following title:
    Title: ${title}
    
    Notes from the author:
    ${notes}
    
    The outline should include:
    1. A brief book summary.
    2. A list of 5-10 chapters with a short description for each.
    
    Format the output as a structured outline.
    `;
    
    try {
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Error generating outline:", error);
        throw error;
    }
}

export async function processPendingOutlines() {
    const { data, error } = await supabase
        .from("books")
        .select("*")
        .is("outline", null)
        .not("notes_on_outline_before", "is", null);

    if (error) {
        console.error("Error fetching books:", error);
        return;
    }

    for (const book of data) {
        console.log(`Generating outline for: ${book.title}`);
        try {
            const outline = await generateOutline(book.title, book.notes_on_outline_before);
            
            await supabase
                .from("books")
                .update({
                    outline: outline,
                    status_outline_notes: "pending_review"
                })
                .eq("id", book.id);
            
            console.log(`Outline generated for ${book.title}`);
        } catch (err) {
            console.error(`Failed to process book ${book.id}:`, err);
        }
    }
}

export async function parseOutlineAndCreateChapters(bookId, outlineText) {
    const chapterMatches = [...outlineText.matchAll(/Chapter\s+(\d+)[:\.-]\s*(.*)/gi)];
    
    const chapters = chapterMatches.map(match => ({
        book_id: bookId,
        chapter_number: parseInt(match[1]),
        title: match[2].trim(),
        status: "pending",
        chapter_notes_status: "no"
    }));

    if (chapters.length > 0) {
        const { error } = await supabase.from("chapters").insert(chapters);
        if (error) console.error("Error inserting chapters:", error);
        else console.log(`Initialized ${chapters.length} chapters for book ${bookId}`);
    }
}
