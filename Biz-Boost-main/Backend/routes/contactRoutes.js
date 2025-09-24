// routes/contact.js
const express = require('express');
const { submitContactForm } = require('../controllers/contactController');

const router = express.Router();

// POST /api/contact
router.post('/contact', submitContactForm);

module.exports = router;
