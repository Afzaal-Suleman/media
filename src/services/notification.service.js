import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendEmail(to, subject, text) {
    if (!process.env.SMTP_USER || process.env.SMTP_USER === "your_email") {
        console.log(`Notification to ${to}: ${subject} - ${text}`);
        return;
    }

    try {
        await transporter.sendMail({
            from: '"Book Gen System" <no-reply@bookgen.com>',
            to,
            subject,
            text,
        });
    } catch (error) {
        console.error("Error sending email:", error);
    }
}