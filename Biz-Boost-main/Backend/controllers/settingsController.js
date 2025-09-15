const Settings = require('../models/settings');

exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.findOne();
    res.json(settings || {});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
};

exports.saveSettings = async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to save settings' });
  }
};