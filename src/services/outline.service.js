import { model } from "../config/gemini.js";
import { supabase } from "../config/supabase.js";

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
    
    const result = await model.generateContent(prompt);
    return result.response.text();
}

export async function parseAndSaveChapters(bookId, outlineText) {
    const chapterMatches = [...outlineText.matchAll(/Chapter\s+(\d+)[:\.-]\s*(.*)/gi)];
    
    const chapters = chapterMatches.map(match => ({
        book_id: bookId,
        chapter_number: parseInt(match[1]),
        title: match[2].trim(),
        status: "pending",
        chapter_notes_status: "no"
    }));

    if (chapters.length > 0) {
        await supabase.from("chapters").insert(chapters);
    }
}