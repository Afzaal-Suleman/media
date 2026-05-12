import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { supabase } from "../config.js";
import fs from "fs";

export async function compileBook(bookId) {
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

    const children = [
        new Paragraph({
            text: book.title,
            heading: HeadingLevel.TITLE,
            alignment: "center",
        }),
        new Paragraph({ text: "\n" }),
    ];

    chapters.forEach(chapter => {
        children.push(
            new Paragraph({
                text: `Chapter ${chapter.chapter_number}: ${chapter.title || "Untitled"}`,
                heading: HeadingLevel.HEADING_1,
                pageBreakBefore: true,
            }),
            new Paragraph({ text: "\n" })
        );

        const paragraphs = chapter.content.split("\n");
        paragraphs.forEach(p => {
            if (p.trim()) {
                children.push(new Paragraph({
                    children: [new TextRun(p.trim())],
                    spacing: { after: 200 },
                }));
            }
        });
    });

    const doc = new Document({
        sections: [{ properties: {}, children: children }],
    });

    const fileName = `${book.title.replace(/\s+/g, "_")}_Final_Draft.docx`;
    const filePath = `./output/${fileName}`;

    if (!fs.existsSync("./output")) fs.mkdirSync("./output");

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(filePath, buffer);

    await supabase.from("books").update({
        book_output_status: "compiled"
    }).eq("id", bookId);

    return filePath;
}
