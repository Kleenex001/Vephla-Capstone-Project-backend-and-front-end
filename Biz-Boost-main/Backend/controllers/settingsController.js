// controllers/settingsController.js
const Settings = require('../models/settings');

// GET current user's settings
exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.findOne({ userId: req.user.id });
    res.status(200).json(settings || {}); // return empty object if none exists
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ status: "error", message: "Failed to fetch settings", error: error.message });
  }
};

// SAVE or UPDATE current user's settings
exports.saveSettings = async (req, res) => {
  try {
    const {
      businessName,
      contactPerson,
      email,
      phone,
      businessCategory,
      language,
      currency,
      dateFormat,
      notifications,
      exportData,
      cloudBackup
    } = req.body;

    // Required fields validation
    if (!businessName || !contactPerson || !email) {
      return res.status(400).json({ status: "fail", message: "Required fields missing" });
    }

    const updatedSettings = await Settings.findOneAndUpdate(
      { userId: req.user.id }, // 👈 scope to this user
      {
        userId: req.user.id,
        businessName,
        contactPerson,
        email,
        phone,
        businessCategory,
        language,
        currency,
        dateFormat,
        notifications: Boolean(notifications),
        exportData: Boolean(exportData),
        cloudBackup: Boolean(cloudBackup),
      },
      { new: true, upsert: true } // return updated doc, create if missing
    );

    res.status(200).json({ status: "success", data: updatedSettings });
  } catch (error) {
    console.error("Error saving settings:", error);
    res.status(500).json({ status: "error", message: "Failed to save settings", error: error.message });
  }
};
