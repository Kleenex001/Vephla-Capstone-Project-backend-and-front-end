// resetpassword.js
const form = document.getElementById('resetForm'); 
const emailInput = document.getElementById('email');
const otpInput = document.getElementById('otp');
const newPasswordInput = document.getElementById('newPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');

const emailError = document.getElementById('emailError');
const otpError = document.getElementById('otpError');
const newPasswordError = document.getElementById('newPasswordError');
const confirmPasswordError = document.getElementById('confirmPasswordError');
const message = document.getElementById('message');

const BASE_URL = "https://vephla-capstone-project-backend-and.onrender.com/api";

// === Auto-fill email from query string ===
const urlParams = new URLSearchParams(window.location.search);
const emailFromQuery = urlParams.get('email');
if (emailFromQuery) {
  emailInput.value = decodeURIComponent(emailFromQuery);
  emailInput.readOnly = true; // Make email uneditable
  emailInput.style.backgroundColor = "#f0f0f0"; // Optional styling
}

form.addEventListener('submit', async function(event) {
  event.preventDefault();

  // Clear previous error messages
  emailError.textContent = '';
  otpError.textContent = '';
  newPasswordError.textContent = '';
  confirmPasswordError.textContent = '';
  message.textContent = '';

  // Validate email
  const email = emailInput.value.trim();
  if (!email || !email.includes('@') || !email.includes('.')) {
    emailError.textContent = 'Enter a valid email address';
    return;
  }

  // Validate OTP
  const otp = otpInput.value.trim();
  if (!otp || otp.length !== 6) {
    otpError.textContent = 'Enter the 6-digit OTP sent to your email';
    return;
  }

  // Validate new password
  const newPassword = newPasswordInput.value;
  if (!newPassword || newPassword.length < 6) {
    newPasswordError.textContent = 'Password must be at least 6 characters long';
    return;
  }

  // Validate confirm password
  const confirmPassword = confirmPasswordInput.value;
  if (confirmPassword !== newPassword) {
    confirmPasswordError.textContent = 'Passwords do not match';
    return;
  }

  try {
    // Call backend
    const res = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword })
    });

    const data = await res.json();

    if (res.ok) {
      message.style.color = 'green';
      message.textContent = data.message || 'Password reset successful!';
      setTimeout(() => {
        window.location.href = 'signin.html';
      }, 2000);
    } else {
      message.style.color = 'red';
      message.textContent = data.message || 'Failed to reset password. Try again.';
    }
  } catch (error) {
    console.error('Reset Password Error:', error);
    message.style.color = 'red';
    message.textContent = 'Server error. Please try again later.';
  }
});
