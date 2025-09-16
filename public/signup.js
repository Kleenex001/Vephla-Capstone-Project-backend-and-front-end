// signup.js
import { signupUser } from './api.js';

const signupForm = document.getElementById('signupForm');

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

// === Main Submit Handler ===
signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Collect input fields
  const fields = {
    firstName: document.getElementById('firstName'),
    lastName: document.getElementById('lastName'),
    businessName: document.getElementById('bName'),
    email: document.getElementById('email'),
    phoneNumber: document.getElementById('phoneNumber'),
    password: document.getElementById('pWord'),
    confirmPassword: document.getElementById('cPassword'),
    terms: document.getElementById('terms'),
    successMsg: document.getElementById('successMsg'),
  };

  // Collect error fields
  const errors = {
    firstName: document.getElementById('firstNameError'),
    lastName: document.getElementById('lastNameError'),
    businessName: document.getElementById('BnameError'),
    email: document.getElementById('emailError'),
    phoneNumber: document.getElementById('phoneError'),
    password: document.getElementById('pwordError'),
    confirmPassword: document.getElementById('cPasswordError'),
    terms: document.getElementById('termsError'),
    successMsg: document.getElementById('successMsg'),
  };

  let valid = true;

  // === Field Validations ===
  if (fields.firstName.value.trim().length < 2) {
    showError(fields.firstName, errors.firstName, 'First name must be at least 2 characters.');
    valid = false;
  } else clearError(fields.firstName, errors.firstName);

  if (fields.lastName.value.trim().length < 2) {
    showError(fields.lastName, errors.lastName, 'Last name must be at least 2 characters.');
    valid = false;
  } else clearError(fields.lastName, errors.lastName);

  if (fields.businessName.value.trim().length < 2) {
    showError(fields.businessName, errors.businessName, 'Business name must be at least 2 characters.');
    valid = false;
  } else clearError(fields.businessName, errors.businessName);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(fields.email.value.trim())) {
    showError(fields.email, errors.email, 'Enter a valid email (e.g., user@example.com).');
    valid = false;
  } else clearError(fields.email, errors.email);

  const phoneRegex = /^\+?\d{10,14}$/;
  if (!phoneRegex.test(fields.phoneNumber.value.trim())) {
    showError(fields.phoneNumber, errors.phoneNumber, 'Phone must be 10–14 digits (e.g., +2341234567890).');
    valid = false;
  } else clearError(fields.phoneNumber, errors.phoneNumber);

  if (fields.password.value.length < 6) {
    showError(fields.password, errors.password, 'Password must be at least 6 characters.');
    valid = false;
  } else clearError(fields.password, errors.password);

  if (fields.password.value !== fields.confirmPassword.value) {
    showError(fields.confirmPassword, errors.confirmPassword, 'Passwords do not match.');
    valid = false;
  } else clearError(fields.confirmPassword, errors.confirmPassword);

  if (!fields.terms.checked) {
    showError(fields.terms, errors.terms, 'You must accept the terms and conditions.');
    valid = false;
  } else clearError(fields.terms, errors.terms);

  if (!valid) return;

  // === Build Payload for Backend ===
  const payload = {
    firstName: fields.firstName.value.trim(),
    lastName: fields.lastName.value.trim(),
    businessName: fields.businessName.value.trim(),
    email: fields.email.value.trim(),
    phoneNumber: fields.phoneNumber.value.trim(),
    password: fields.password.value.trim(),
  };

  try {
    const response = await signupUser(payload);

    // Check if backend returned a success message
    if (response && (response.message || response.token)) {
      errors.successMsg.textContent = '✅ Signup successful! Redirecting to login...';
      errors.successMsg.style.display = 'block';
      errors.successMsg.classList.remove('input-error');

      signupForm.reset();

      setTimeout(() => {
        window.location.href = 'signin.html';
      }, 2000);
    } else {
      errors.successMsg.textContent = `❌ Signup failed: ${response?.message || 'Unknown error'}`;
      errors.successMsg.style.display = 'block';
      errors.successMsg.classList.add('input-error');
    }
  } catch (error) {
    console.error('Signup error:', error);
    errors.successMsg.textContent = `❌ Signup failed: ${error.message}`;
    errors.successMsg.style.display = 'block';
    errors.successMsg.classList.add('input-error');
  }
});
