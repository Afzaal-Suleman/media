import { supabase } from "../config/supabase.js";
import { createDocx } from "../services/compile.service.js";

export async function runCompilation(bookId) {
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
        .eq("status", "completed")
        .order("chapter_number", { ascending: true });

    if (chaptersError || !chapters || chapters.length === 0) return;

    const filePath = await createDocx(book.title, chapters);

    await supabase.from("books").update({
        book_output_status: "compiled"
    }).eq("id", bookId);

    return filePath;
}