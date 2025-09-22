// routes/settingsRoutes.js
const express = require('express');
const router = express.Router();
const { getSettings, saveSettings } = require('../controllers/settingsController');

// GET current settings / POST to save settings
router.route('/')
  .get(getSettings)
  .post(saveSettings);

module.exports = router;
