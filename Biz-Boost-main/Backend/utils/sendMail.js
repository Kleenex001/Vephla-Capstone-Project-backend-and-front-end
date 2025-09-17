// sendMail.js
const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text, otp) => {
  try {
    // Check if credentials exist
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("Missing EMAIL_USER or EMAIL_PASS in environment variables");
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verify transporter before sending
    await transporter.verify();
    console.log("Email transporter is ready!");

    // Send the email
    await transporter.sendMail({
      from: `"BizBoost Support" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html: `<h2>Your OTP is <strong>${otp}</strong></h2>`,
    });

    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error("Email sending failed:", error.message);
    throw error; // rethrow so your controller catches it
  }
};

module.exports = sendEmail;
