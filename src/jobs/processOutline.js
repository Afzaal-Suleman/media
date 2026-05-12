import { supabase } from "../config/supabase.js";
import { generateOutline } from "../services/outline.service.js";

export async function processPendingOutlines() {
    const { data, error } = await supabase
        .from("books")
        .select("*")
        .is("outline", null)
        .not("notes_on_outline_before", "is", null);

    if (error) return;

    for (const book of data) {
        try {
            const outline = await generateOutline(book.title, book.notes_on_outline_before);
            await supabase
                .from("books")
                .update({ outline, status_outline_notes: "pending_review" })
                .eq("id", book.id);
        } catch (err) {
            console.error(`Failed to process book ${book.id}:`, err);
        }
    }
}