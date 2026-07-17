import nodemailer from 'nodemailer';
import Mailjet from 'node-mailjet';
import dotenv from 'dotenv';
import axios from 'axios';

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

// Function to send an email using Nodemailer
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
    return details;
};

const mailjet = Mailjet.apiConnect(
  process.env.MJ_APIKEY_PUBLIC,
  process.env.MJ_APIKEY_PRIVATE
);

export const sendEmailMailjet = async (to, subject, html, text, toName = '') => {
  try {
    const request = mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: process.env.MJ_SENDER_EMAIL,
            Name: process.env.MJ_SENDER_NAME,
          },
          To: [
            {
              Email: to,
              Name: toName || to,
            },
          ],
          Subject: subject,
          HTMLPart: html,
          TextPart: text,
        },
      ],
    });

    const result = await request;
    return { success: true, data: result.body };
  } catch (error) {
    console.error('Mailjet send error:', error?.statusCode, error?.message);
    return { success: false, error: error?.message || 'Failed to send email' };
  }
};
