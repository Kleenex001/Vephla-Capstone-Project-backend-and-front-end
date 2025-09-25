// utils/sendContactMail.js
const nodemailer = require('nodemailer');

const sendContactMail = async (to, subject, message) => {
  try {
    // Ensure email credentials exist
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("Missing EMAIL_USER or EMAIL_PASS in environment variables");
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verify transporter
    await transporter.verify();
    console.log("Email transporter is ready!");

    // Simple HTML template for contact form
    const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: #f9f9f9;">
        <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
          <h2>New Contact Form Submission</h2>
          <p><strong>From:</strong> ${to}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"BizBoost Support" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: message,
      html: htmlTemplate,
    });

    console.log(`Contact form email sent successfully to ${to}`);
  } catch (error) {
    console.error("Failed to send contact email:", error.message);
    throw error;
  }
};

module.exports = sendContactMail;
