import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// connection between web server and SMTP server to send emails
const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        type: "OAuth2",
        user: process.env.GOOGLE_USER,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    },
});

// Verify the transporter configuration
transporter.verify((error, success) => {
    if (error) {
        console.error("Error setting up email transporter:", error);
    }
    else {
        console.log("Email transporter is ready to send messages ✅");
    }
});

// Function to send an email
export const sendEmail = async (to, subject, html, text) => {
    const mailOptions = {
        from: process.env.GOOGLE_USER,
        to,
        subject,
        html,
        text,
    };
    const details= await transporter.sendMail(mailOptions);
    console.log("Email sent:", details);
    return "Email sent successfully to " + to;
};
