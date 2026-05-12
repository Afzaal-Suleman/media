import { processPendingOutlines } from "./src/jobs/processOutline.js";
import { processNextChapter } from "./src/jobs/processChapters.js";
import { runCompilation } from "./src/jobs/compileBook.js";
import { supabase } from "./src/config/supabase.js";
import { sendEmail } from "./src/services/notification.service.js";

async function main() {
    console.log("Starting Book Generation System (Polling)...");

    // 1. Process Outlines
    await processPendingOutlines();

    // 2. Process Chapters for all active books
    const { data: activeBooks, error } = await supabase
        .from("books")
        .select("id, title")
        .neq("book_output_status", "compiled");

    if (error) {
        console.error("Error fetching active books:", error);
    } else {
        for (const book of activeBooks) {
            await processNextChapter(book.id);
        }
    }

    // 3. Check if any book is ready for compilation
    const { data: readyBooks } = await supabase
        .from("books")
        .select("id, title")
        .eq("final_review_notes_status", "no_notes_needed")
        .eq("book_output_status", "pending");

    if (readyBooks) {
        for (const book of readyBooks) {
            const { count } = await supabase
                .from("chapters")
                .select("*", { count: "exact", head: true })
                .eq("book_id", book.id)
                .neq("status", "completed");

            if (count === 0) {
                console.log(`Compiling book: ${book.title}`);
                await runCompilation(book.id);
                await sendEmail(
                    process.env.ADMIN_EMAIL || "admin@example.com",
                    "Book Compiled!",
                    `The book "${book.title}" has been successfully compiled and is ready for download.`
                );
            }
        }
    }

    console.log("Polling cycle complete.");
}

// Run polling logic
main().catch(console.error);
