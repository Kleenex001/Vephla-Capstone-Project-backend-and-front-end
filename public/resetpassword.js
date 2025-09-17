// resetpassword.js
import { resetPassword } from "./api.js";

const form = document.getElementById("resetForm");
const emailInput = document.getElementById("email");
const otpInput = document.getElementById("otp");
const newPasswordInput = document.getElementById("newPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");

const emailError = document.getElementById("emailError");
const otpError = document.getElementById("otpError");
const newPasswordError = document.getElementById("newPasswordError");
const confirmPasswordError = document.getElementById("confirmPasswordError");
const message = document.getElementById("message");

// === Auto-fill email from query string ===
const urlParams = new URLSearchParams(window.location.search);
const emailFromQuery = urlParams.get("email");
if (emailFromQuery) {
  emailInput.value = decodeURIComponent(emailFromQuery);
  emailInput.readOnly = true; // prevent editing
  emailInput.style.backgroundColor = "#f4f4f4"; 
  emailInput.style.color = "#666";
  emailInput.style.cursor = "not-allowed";
  emailInput.style.border = "1px solid #ccc";
}

form.addEventListener("submit", async function (event) {
  event.preventDefault();

  // Clear errors
  emailError.textContent = "";
  otpError.textContent = "";
  newPasswordError.textContent = "";
  confirmPasswordError.textContent = "";
  message.textContent = "";

  // Validate email (readonly but still check)
  const email = emailInput.value.trim();
  if (!email || !email.includes("@") || !email.includes(".")) {
    emailError.textContent = "Enter a valid email address";
    return;
  }

  // Validate OTP
  const otp = otpInput.value.trim();
  if (!otp || otp.length !== 6) {
    otpError.textContent = "Enter the 6-digit OTP sent to your email";
    return;
  }

  // Validate new password
  const newPassword = newPasswordInput.value;
  if (!newPassword || newPassword.length < 6) {
    newPasswordError.textContent = "Password must be at least 6 characters long";
    return;
  }

  // Validate confirm password
  const confirmPassword = confirmPasswordInput.value;
  if (confirmPassword !== newPassword) {
    confirmPasswordError.textContent = "Passwords do not match";
    return;
  }

  try {
    // ✅ Call backend via api.js
    const res = await resetPassword(email, otp, newPassword);

    message.style.color = "green";
    message.textContent = res.message || "Password reset successful!";
    setTimeout(() => {
      window.location.href = "signin.html";
    }, 2000);
  } catch (error) {
    message.style.color = "red";
    message.textContent = error.message || "Failed to reset password. Try again.";
  }
});
