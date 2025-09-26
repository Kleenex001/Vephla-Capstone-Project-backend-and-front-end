import { submitContactForm, showToast } from "./api.js";

const newsLetterForm = document.getElementsByClassName("newsLetter-form")[0];

newsLetterForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  // Get form values
  const name = document.getElementById("name");
  const email = document.getElementById("email");
  const comments = document.getElementById("comments");

  // Error elements
  const errors = {
    name: document.getElementById("nameError"),
    email: document.getElementById("emailError"),
    comments: document.getElementById("commentsError"),
  };

  // Clear previous errors with fade-out
  Object.values(errors).forEach(errEl => {
    errEl.style.transition = "all 0.3s ease";
    errEl.style.opacity = "0";
  });

  let isValid = true;

  // Name validation
  if (name.value.trim() === "" || name.value.length < 3) {
    errors.name.textContent = "Enter your full name";
    errors.name.style.display = "block";
    setTimeout(() => { errors.name.style.opacity = "1"; }, 10);
    name.classList.add("input-error");
    isValid = false;
  } else {
    errors.name.textContent = "";
    errors.name.style.display = "none";
    name.classList.remove("input-error");
  }

  // Email validation
  if (!(email.value.includes("@") && email.value.includes(".com"))) {
    errors.email.textContent = "Enter a valid email address";
    errors.email.style.display = "block";
    setTimeout(() => { errors.email.style.opacity = "1"; }, 10);
    email.classList.add("input-error");
    isValid = false;
  } else {
    errors.email.textContent = "";
    errors.email.style.display = "none";
    email.classList.remove("input-error");
  }

  // Comments validation
  if (comments.value.trim() === "") {
    errors.comments.textContent = "Enter your comments";
    errors.comments.style.display = "block";
    setTimeout(() => { errors.comments.style.opacity = "1"; }, 10);
    comments.classList.add("input-error");
    isValid = false;
  } else {
    errors.comments.textContent = "";
    errors.comments.style.display = "none";
    comments.classList.remove("input-error");
  }

  if (!isValid) return;

  try {
    // Call backend API
    const response = await submitContactForm({
      name: name.value.trim(),
      email: email.value.trim(),
      message: comments.value.trim(),
    });

    showToast(response.message, "success");

    // Animate form reset
    newsLetterForm.style.transition = "all 0.5s ease";
    newsLetterForm.style.opacity = "0";
    setTimeout(() => {
      newsLetterForm.reset();
      newsLetterForm.style.opacity = "1";
    }, 500);
  } catch (err) {
    console.error("Contact form submission error:", err);
    showToast(err.message || "Failed to send your enquiry. Please try again later.", "error");
  }
});
