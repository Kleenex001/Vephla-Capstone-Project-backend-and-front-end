const express = require('express'); 
const router = express.Router(); 
const {
  signUp,
  signIn,
  logout,
  requestPasswordReset,
  resetPassword
} = require('../controllers/authController'); 
const { protect } = require('../middleware/authMiddleware');

// Register a new user
router.post('/signup', signUp);

// Login user and return JWT
router.post('/signin', signIn);

// Request password reset (send OTP to email)
router.post('/request-password-reset', requestPasswordReset);

// Verify OTP and reset password
router.post('/reset-password', resetPassword);

// Logout user (requires JWT)
router.post('/logout', protect, logout);

module.exports = router;
