// controllers/settingsController.js
const Settings = require('../models/settings');

// GET current settings
exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.findOne();
    res.json(settings || {}); // return empty object if none exists
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
};

// SAVE or UPDATE settings
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

    // Optional: basic validation
    if (!businessName || !contactPerson || !email) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const updatedSettings = await Settings.findOneAndUpdate(
      {}, // find the first (and only) settings doc
      {
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
        cloudBackup: Boolean(cloudBackup)
      },
      { new: true, upsert: true } // return updated doc, create if missing
    );

    res.json(updatedSettings);
  } catch (error) {
    console.error("Error saving settings:", error);
    res.status(500).json({ message: 'Failed to save settings' });
  }
};
