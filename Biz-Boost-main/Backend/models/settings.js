const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  businessName: String,
  contactPerson: String,
  email: String,
  phone: String,
  businessCategory: String,
  language: String,
  currency: String,
  dateFormat: String,
  notifications: Boolean,
  exportData: Boolean,
  cloudBackup: Boolean,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Settings', SettingsSchema);