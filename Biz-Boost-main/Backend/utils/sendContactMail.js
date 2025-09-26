const nodemailer = require("nodemailer");

const sendContactMail = async (fromEmail, subject, message) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("Missing EMAIL_USER or EMAIL_PASS in environment variables");
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // must be Gmail App Password
      },
    });

    // Check Gmail connection
    await transporter.verify();
    console.log("✅ Gmail transporter is ready!");

    // HTML template
    const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: #f9f9f9;">
        <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
          <h2>New Contact Form Submission</h2>
          <p><strong>From:</strong> ${fromEmail}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
        </div>
      </div>
    `;

    // Always send TO your support inbox
    await transporter.sendMail({
      from: `"BizBoost Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // ← always deliver to your support inbox
      subject,
      text: message,
      html: htmlTemplate,
    });

    console.log(`📧 Contact form email sent successfully from ${fromEmail}`);
  } catch (error) {
    console.error("❌ Failed to send contact email:", error);
    throw error;
  }
};

module.exports = sendContactMail;
