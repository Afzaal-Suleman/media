import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "../config.js";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function summarizeChapter(content) {
    const prompt = `Summarize the following book chapter in 2-3 concise paragraphs, focusing on key plot points and character development: \n\n ${content}`;
    const result = await model.generateContent(prompt);
    return result.response.text();
}

export async function generateChapter(bookTitle, outline, chapterNumber, previousSummaries, chapterNotes) {
    const context = previousSummaries.length > 0 
        ? `Previous Chapters Summaries:\n${previousSummaries.join("\n\n")}`
        : "This is the first chapter.";

    const prompt = `
    Title: ${bookTitle}
    Outline: ${outline}
    
    ${context}
    
    Task: Write Chapter ${chapterNumber} of this book.
    ${chapterNotes ? `Additional Notes for this chapter: ${chapterNotes}` : ""}
    
    Requirements:
    - Maintain consistency with previous chapters.
    - Write in an engaging style.
    - Minimum 1000 words.
    - Focus on the chapter's specific goal as defined in the outline.
    `;

    try {
        const result = await model.generateContent(prompt);
        const content = result.response.text();
        const summary = await summarizeChapter(content);
        return { content, summary };
    } catch (error) {
        console.error(`Error generating Chapter ${chapterNumber}:`, error);
        throw error;
    }
}

export async function processNextChapter(bookId) {
    const { data: book, error: bookError } = await supabase
        .from("books")
        .select("*")
        .eq("id", bookId)
        .single();

    if (bookError || !book) return;

    const { data: chapters, error: chaptersError } = await supabase
        .from("chapters")
        .select("*")
        .eq("book_id", bookId)
        .order("chapter_number", { ascending: true });

    if (chaptersError) return;

    const nextChapter = chapters.find(c => c.status === "pending");
    if (!nextChapter) return;

    if (nextChapter.chapter_notes_status === "yes" && !nextChapter.chapter_notes) return;

    const previousSummaries = chapters
        .filter(c => c.chapter_number < nextChapter.chapter_number && c.status === "completed")
        .map(c => `Chapter ${c.chapter_number} Summary: ${c.summary}`);

    console.log(`Generating Chapter ${nextChapter.chapter_number} for ${book.title}...`);
    
    try {
        await supabase.from("chapters").update({ status: "generating" }).eq("id", nextChapter.id);

        const { content, summary } = await generateChapter(
            book.title, 
            book.outline, 
            nextChapter.chapter_number, 
            previousSummaries, 
            nextChapter.chapter_notes
        );

        await supabase.from("chapters").update({
            content: content,
            summary: summary,
            status: "review",
            chapter_notes_status: "pending_review"
        }).eq("id", nextChapter.id);

    } catch (err) {
        await supabase.from("chapters").update({ status: "pending" }).eq("id", nextChapter.id);
    }
}
