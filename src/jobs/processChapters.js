import { supabase } from "../config/supabase.js";
import { generateChapterContent } from "../services/chapter.service.js";
import { summarizeChapter } from "../services/summary.service.js";

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

    try {
        await supabase.from("chapters").update({ status: "generating" }).eq("id", nextChapter.id);

        const content = await generateChapterContent(
            book.title, 
            book.outline, 
            nextChapter.chapter_number, 
            previousSummaries, 
            nextChapter.chapter_notes
        );

        const summary = await summarizeChapter(content);

        await supabase.from("chapters").update({
            content,
            summary,
            status: "review",
            chapter_notes_status: "pending_review"
        }).eq("id", nextChapter.id);

    } catch (err) {
        await supabase.from("chapters").update({ status: "pending" }).eq("id", nextChapter.id);
    }
}