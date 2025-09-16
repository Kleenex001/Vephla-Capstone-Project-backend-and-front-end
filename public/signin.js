// signin.js
import { endpoints, apiRequest } from './api.js';

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
    const payload = {
      email: email.value.trim(),
      password: password.value.trim(),
    };

    // ✅ Call backend API
    const response = await apiRequest(`${endpoints.auth}/signin`, 'POST', payload);

    console.log('Signin response:', response);

    if (response && response.token) {
      // ✅ Save token for future API calls
      localStorage.setItem('token', response.token);

      // ✅ Show success message
      emailError.textContent = '✅ Login successful! Redirecting to dashboard...';
      emailError.style.display = 'block';
      emailError.classList.remove('input-error');

      signinForm.reset();

      // ✅ Redirect
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1500);
    } else {
      // ❌ Backend returned no token
      emailError.textContent = `❌ Login failed: ${response?.message || 'Invalid credentials'}`;
      emailError.style.display = 'block';
      emailError.classList.add('input-error');
    }
  } catch (error) {
    console.error('Signin error:', error);
    emailError.textContent = `❌ Login failed: ${error.message}`;
    emailError.style.display = 'block';
    emailError.classList.add('input-error');
  }
});
