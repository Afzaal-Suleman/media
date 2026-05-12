import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import fs from "fs";

export async function createDocx(title, chapters) {
    const children = [
        new Paragraph({
            text: title,
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

    const fileName = `${title.replace(/\s+/g, "_")}_Final_Draft.docx`;
    const filePath = `./output/${fileName}`;

    if (!fs.existsSync("./output")) fs.mkdirSync("./output");

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(filePath, buffer);

    return filePath;
}