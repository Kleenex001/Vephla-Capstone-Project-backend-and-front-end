// signin.js
import { loginUser } from './api.js';

const signinForm = document.getElementById('signinForm');

// === Validation Helpers ===
const showError = (input, errorElement, message) => {
  errorElement.textContent = message;
  errorElement.style.display = 'block';
  input.classList.add('input-error');
};

const clearError = (input, errorElement) => {
  errorElement.textContent = '';
  errorElement.style.display = 'none';
  input.classList.remove('input-error');
};

// === Submit Handler ===
signinForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Fields
  const email = document.getElementById('email');
  const password = document.getElementById('password');

  // Errors
  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');
  const successMsg = document.getElementById('successMsg'); 

  let valid = true;

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.value.trim())) {
    showError(email, emailError, 'Enter a valid email (e.g., user@example.com).');
    valid = false;
  } else clearError(email, emailError);

  // Password validation
  if (password.value.trim().length < 6) {
    showError(password, passwordError, 'Password must be at least 6 characters.');
    valid = false;
  } else clearError(password, passwordError);

  if (!valid) return;

  try {
    const response = await loginUser(email.value.trim(), password.value.trim());

    if (response && response.token) {
      successMsg.textContent = 'Login successful! Redirecting to dashboard...';
      successMsg.style.display = 'block';
      successMsg.classList.remove('input-error');

      signinForm.reset();

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1500);
    } else {
      successMsg.textContent = `Login failed: ${response?.message || 'Invalid credentials'}`;
      successMsg.style.display = 'block';
      successMsg.classList.add('input-error');
    }
  } catch (error) {
    console.error('Signin error:', error);
    successMsg.textContent = `Login failed: ${error.message}`;
    successMsg.style.display = 'block';
    successMsg.classList.add('input-error');
  }
});
