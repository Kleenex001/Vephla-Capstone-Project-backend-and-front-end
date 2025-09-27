const ContactMessage = require('../models/ContactMessage');

// Save contact form submission to DB
const submitContactForm = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        status: "error",
        message: "Name, email, and message are required.",
      });
    }

    const contactMessage = new ContactMessage({
      name,
      email,
      message,
    });

    await contactMessage.save();

    return res.status(201).json({
      status: "success",
      message: "Your enquiry has been submitted successfully.",
      data: contactMessage,
    });
  } catch (err) {
    console.error("❌ Failed to save contact form:", err);
    return res.status(500).json({
      status: "error",
      message: "Something went wrong while submitting your enquiry.",
    });
  }
};

// Fetch all contact messages
const getContactMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });

    return res.status(200).json({
      status: "success",
      count: messages.length,
      data: messages,
    });
  } catch (err) {
    console.error("Failed to fetch contact messages:", err);
    return res.status(500).json({
      status: "error",
      message: "Something went wrong while fetching messages.",
    });
  }
};

module.exports = { submitContactForm, getContactMessages };
