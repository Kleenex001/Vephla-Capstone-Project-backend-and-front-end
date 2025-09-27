const express = require('express');
const { submitContactForm, getContactMessages } = require('../controllers/contactController');

const router = express.Router();

// POST /api/contact → Save form
router.post('/', submitContactForm);

// GET /api/contact → Fetch all messages
router.get('/', getContactMessages);

module.exports = router;
