// models/Settings.js
const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  businessName: { type: String, required: true },
  contactPerson: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  businessCategory: { type: String },
  language: { type: String, default: 'English' },
  currency: { type: String, default: 'NGN' },
  dateFormat: { type: String, default: 'DD/MM/YYYY' },
  notifications: { type: Boolean, default: true },
  exportData: { type: Boolean, default: false },
  cloudBackup: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Settings', SettingsSchema);
