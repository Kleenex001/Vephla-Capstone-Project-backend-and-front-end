const express = require('express');
const router = express.Router();
const { getSettings, saveSettings } = require('../controllers/settingsController');
const { protect } = require('../middleware/authMiddleware');

// GET current settings / POST to save settings (protected)
router.route('/')
  .get(protect, getSettings)
  .post(protect, saveSettings);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: Manage business settings
 */

/**
 * @swagger
 * /settings:
 *   get:
 *     summary: Get current settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *   post:
 *     summary: Save or update settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessName
 *               - contactPerson
 *               - email
 *             properties:
 *               businessName:
 *                 type: string
 *               contactPerson:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               businessCategory:
 *                 type: string
 *               language:
 *                 type: string
 *               currency:
 *                 type: string
 *               dateFormat:
 *                 type: string
 *               notifications:
 *                 type: boolean
 *               exportData:
 *                 type: boolean
 *               cloudBackup:
 *                 type: boolean
 */
