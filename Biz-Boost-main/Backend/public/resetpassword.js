const form = document.getElementById('resetForm');
const emailError = document.getElementById('emailError');
 const otpError = document.getElementById('otpError');
const newPasswordError = document.getElementById('newPasswordError');
const confirmPasswordError = document.getElementById('confirmPasswordError');
const message = document.getElementById('message');

form.addEventListener('submit', async function(event) {
  event.preventDefault();

  // Clear previous error messages
  emailError.textContent = '';
   otpError.textContent = '';
  newPasswordError.textContent = '';
  confirmPasswordError.textContent = '';
  message.textContent = '';

  // Validate email
  const email = document.getElementById('email').value.trim();
  if (!email || !email.includes('@') || !email.includes('.')) {
    emailError.textContent = 'Enter a valid email address';
    return;
  }

//validate Otp



  // Validate new password
  const newPassword = document.getElementById('newPassword').value;
  if (!newPassword || newPassword.length < 6) {
    newPasswordError.textContent = 'Password must be at least 6 characters long';
    return;
  }

  // Validate confirm password
  const confirmPassword = document.getElementById('confirmPassword').value;
  if (confirmPassword !== newPassword) {
    confirmPasswordError.textContent = 'Passwords do not match';
    return;
  }

  try {
    // API call
    // Replace the mock with your backend endpoint later

    // Mock result
    const result = { success: true };

    if (result.success) {
      message.style.color = 'green';
      message.textContent = ' Password reset successful!';
      setTimeout(() => {
        window.location.href = 'signin.html';
      }, 2000);
    } else {
      message.style.color = 'red';
      message.textContent = result.error || 'Failed to reset password. Try again.';
    }
  } catch (error) {
    console.error(error);
    message.style.color = 'red';
    message.textContent = ' Server error. Please try again later.';
  }
});
