import { model } from "../config/gemini.js";

export async function generateChapterContent(bookTitle, outline, chapterNumber, previousSummaries, chapterNotes) {
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

    const result = await model.generateContent(prompt);
    return result.response.text();
}