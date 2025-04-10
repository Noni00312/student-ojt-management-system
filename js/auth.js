import {
  auth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "./firebase-config.js";

const email = document.getElementById("email");
const password = document.getElementById("password-input");
const confirmPassword = document.getElementById("confirm-password-input");
const submitBtn = document.getElementById("submit");
const errorLabel = document.getElementById("error-label");
const loadingIndicator = document.querySelector(".preloader");

submitBtn.addEventListener("click", (e) => {
  e.preventDefault();
  const emailValue = email.value;
  const passwordValue = password.value;
  const confirmPasswordValue = confirmPassword.value;

  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Creating account...`;

  errorLabel.textContent = "";

  if (passwordValue !== confirmPasswordValue) {
    errorLabel.textContent = "Passwords do not match.";
    errorLabel.classList.add("text-danger");
    submitBtn.disabled = false;
    submitBtn.textContent = "Create account";
    return;
  }

  createUserWithEmailAndPassword(auth, emailValue, passwordValue)
    .then((userCredential) => {
      const user = userCredential.user;

      sendEmailVerification(user)
        .then(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = "Create account";

          loadingIndicator.classList.remove("d-none");

          const intervalId = setInterval(async () => {
            try {
              await user.reload();
              if (user.emailVerified) {
                clearInterval(intervalId);

                localStorage.setItem("userId", user.uid);
                loadingIndicator.classList.add("d-none");
                window.location.href = "/pages/additional-info.html";
              }
              console.log("Checking verification status...");
            } catch (error) {
              console.error("Error checking verification:", error);
              clearInterval(intervalId);
              loadingIndicator.classList.add("d-none");
              errorLabel.textContent =
                "Error verifying email. Please try again.";
              errorLabel.classList.add("text-danger");

              submitBtn.disabled = false;
              submitBtn.textContent = "Create account";
            }
          }, 2000);

          setTimeout(() => {
            clearInterval(intervalId);
            if (!user.emailVerified) {
              loadingIndicator.classList.add("d-none");
              errorLabel.textContent =
                "Verification timeout. Please check your email.";
              errorLabel.classList.add("text-danger");
              submitBtn.disabled = false;
              submitBtn.textContent = "Create account";
            }
          }, 120000);
        })
        .catch((error) => {
          console.error("Error sending verification email:", error);
          errorLabel.textContent = "Error sending verification email.";
          errorLabel.classList.add("text-danger");
          submitBtn.disabled = false;
          submitBtn.textContent = "Create account";
        });
    })
    .catch((error) => {
      const errorCode = error.code;
      if (errorCode === "auth/invalid-email") {
        errorLabel.textContent = "Invalid email address.";
      } else if (errorCode === "auth/email-already-in-use") {
        errorLabel.textContent = "Email already in use.";
      } else if (errorCode === "auth/weak-password") {
        errorLabel.textContent = "Weak password.";
      } else if (errorCode === "auth/operation-not-allowed") {
        errorLabel.textContent = "Operation not allowed.";
      } else if (errorCode === "auth/too-many-requests") {
        errorLabel.textContent = "Too many requests. Try again later.";
      } else {
        errorLabel.textContent = "An unknown error occurred.";
      }
      errorLabel.classList.add("text-danger");
      submitBtn.disabled = false;
      submitBtn.textContent = "Create account";
    });
});
