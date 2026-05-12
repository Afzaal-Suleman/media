import { processPendingOutlines } from "../jobs/processOutline.js";
import { processNextChapter } from "../jobs/processChapters.js";
import { runCompilation } from "../jobs/compileBook.js";

export const triggerOutline = async (req, res) => {
    try {
        await processPendingOutlines();
        res.json({ message: "Outline processing triggered" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const triggerChapter = async (req, res) => {
    const { bookId } = req.body;
    try {
        await processNextChapter(bookId);
        res.json({ message: `Chapter generation triggered for book ${bookId}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const triggerCompile = async (req, res) => {
    const { bookId } = req.body;
    try {
        const filePath = await runCompilation(bookId);
        res.json({ message: "Book compiled", path: filePath });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
