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

    //html template
    const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
        
        <!-- Logo Section -->
        <div style="text-align: center; padding: 20px; background: #222;">
          <img src="https://bizboostcom.vercel.app/Assets/LOGO-TRANS%201.png" alt="BizBoost Logo" style="max-width: 150px;"/>
        </div>

        <!-- Header -->
        <div style="background: #4CAF50; color: #fff; padding: 15px; text-align: center;">
          <h2 style="margin: 0;">Password Reset Verification</h2>
        </div>
        
        <!-- Body -->
        <div style="padding: 20px; color: #333;">
          <p style="font-size: 16px;">Hello 👋,</p>
          <p style="font-size: 15px;">
            You requested to reset your password. Use the OTP code below to continue:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <span style="display: inline-block; font-size: 28px; font-weight: bold; color: #4CAF50; letter-spacing: 5px;">
              ${otp}
            </span>
          </div>
          
          <p style="font-size: 14px; color: #555;">
            ⚠️ This code will expire in <strong>10 minutes</strong>.  
            If you didn’t request this, please ignore this email.
          </p>
          
          <p style="font-size: 14px; margin-top: 20px;">
            Thanks,<br>
            <strong>The BizBoost Team</strong>
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #f1f1f1; text-align: center; padding: 10px; font-size: 12px; color: #777;">
          © ${new Date().getFullYear()} BizBoost. All rights reserved.
        </div>
      </div>
    </div>
  `;

    // Send the email
    await transporter.sendMail({
      from: `"BizBoost Support" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text:`Your OTP is: ${otp}`,
      html: htmlTemplate
    });

    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error("Email sending failed:", error.message);
    throw error; // rethrow so your controller catches it
  }
};

module.exports = sendEmail;
