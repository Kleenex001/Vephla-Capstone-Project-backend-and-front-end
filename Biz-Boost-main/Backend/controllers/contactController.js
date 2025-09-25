// controllers/contactController.js
const sendContactMail = require('../utils/sendContactMail');

const submitContactForm = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Basic validation
    if (!name || !email || !message) {
      return res.status(400).json({
        status: "error",
        message: "Name, email, and message are required.",
      });
    }

    // Send email to support inbo
    await sendContactMail(
      "vsen15024520ajoel@gmail.com", // your support email
      `New Contact Form Submission from ${name}`,
      `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
    );

    return res.status(200).json({
      status: "success",
      message: "Your enquiry has been sent successfully. We'll get back to you soon.",
    });
  } catch (err) {
    console.error("Contact form submission error:", err.message);
    return res.status(500).json({
      status: "error",
      message: "Failed to send your enquiry. Please try again later.",
    });
  }
};

module.exports = { submitContactForm };
