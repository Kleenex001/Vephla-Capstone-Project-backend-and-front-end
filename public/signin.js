// signin.js
import { loginUser } from './api.js';

const signinForm = document.getElementById('signinForm');

// === Toast System ===
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 100);

  // Auto remove after 3s
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Inject toast styles
const style = document.createElement('style');
style.textContent = `
  .toast {
    position: fixed;
    bottom: 30px;
    right: 30px;
    padding: 14px 20px;
    border-radius: 8px;
    color: #fff;
    font-size: 14px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.3s ease, transform 0.3s ease;
    z-index: 9999;
  }
  .toast-success { background: #28a745; }
  .toast-error { background: #dc3545; }
  .toast.show {
    opacity: 1;
    transform: translateY(0);
  }
`;
document.head.appendChild(style);

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
    const response = await loginUser(email.value.trim(), password.value.trim());

    if (response && response.token) {
      // ✅ Save token to localStorage
      localStorage.setItem('authToken', response.token);

      showToast('Login successful! Redirecting...', 'success');

      signinForm.reset();

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1500);
    } else {
      showToast(response?.message || 'Invalid credentials', 'error');
    }
  } catch (error) {
    console.error('Signin error:', error);
    showToast(`Login failed: ${error.message}`, 'error');
  }
});
