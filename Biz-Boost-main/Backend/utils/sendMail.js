const nodemailer = require('nodemailer');
require("dotenv").config();

const sendEmail = async (to, subject, text, otp) => {
  try {
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

    await transporter.verify();
    console.log("✅ Email transporter is ready!");

    const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">

          <div style="text-align: center; padding: 20px; background: #222;">
            <img src="https://bizboostcom.vercel.app/Assets/LOGO-TRANS%201.png" alt="BizBoost Logo" style="max-width: 150px;"/>
          </div>

          <div style="background: #4CAF50; color: #fff; padding: 15px; text-align: center;">
            <h2 style="margin: 0;">Verify Your Email</h2>
          </div>

          <div style="padding: 20px; color: #333;">
            <p>Hello,</p>
            <p>You requested to reset your password. Use the verification code below to continue:</p>

            <div style="text-align: center; margin: 30px 0;">
              <span style="display: inline-block; font-size: 28px; font-weight: bold; color: #4CAF50; letter-spacing: 5px;">
                ${otp}
              </span>
            </div>

            <p>This code will expire in <strong>10 minutes</strong>.</p>
            <p>If you did not request this, please ignore this email.</p>

            <p style="margin-top: 20px;">Thanks,<br><strong>The BizBoost Team</strong></p>
          </div>

          <div style="background: #f1f1f1; text-align: center; padding: 10px; font-size: 12px; color: #777;">
            You are receiving this email because you signed up for BizBoost services.<br/>
            © ${new Date().getFullYear()} BizBoost. All rights reserved.
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"BizBoost Support" <${process.env.EMAIL_USER}>`,
      to,
      subject: subject || "Your BizBoost Verification Code",
      text: text || `Hello,\n\nYou requested a password reset. Your verification code is: ${otp}\n\nIt expires in 10 minutes.\n\nIf you didn’t request this, please ignore this email.\n\n— BizBoost Team`,
      html: htmlTemplate
    });

    console.log(`📩 Email sent successfully to ${to}`);
  } catch (error) {
    console.error("❌ Email sending failed:", error.message);
    throw error;
  }
};

module.exports = sendEmail;
