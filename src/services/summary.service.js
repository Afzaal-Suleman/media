import { model } from "../config/gemini.js";

export async function summarizeChapter(content) {
    const prompt = `Summarize the following book chapter in 2-3 concise paragraphs, focusing on key plot points and character development: \n\n ${content}`;
    const result = await model.generateContent(prompt);
    return result.response.text();
}