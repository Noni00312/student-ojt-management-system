import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBgmAZwLqyNldx-vEQlUXztFyvINWeD1yY",
  authDomain: "student-ojt-management-s-4580f.firebaseapp.com",
  projectId: "student-ojt-management-s-4580f",
  storageBucket: "student-ojt-management-s-4580f.firebasestorage.app",
  messagingSenderId: "636983402790",
  appId: "1:636983402790:web:001c224269afe3f03e61e7",
  measurementId: "G-GPSY1W9J6L",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const login = document.getElementById("login-button");
const errorLabel = document.getElementById("error-label");

login.addEventListener("click", (e) => {
  e.preventDefault();
  const email = document.getElementById("username").value;
  const password = document.getElementById("password-input").value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      console.log("User signed in:", user); // Debugging
      localStorage.setItem("userId", user.uid);
      window.location.href = "/pages/dashboard.html";
    })
    .catch((error) => {
      console.error("Error Code:", error.code);
      console.error("Error Message:", error.message);

      switch (error.code) {
        case "auth/invalid-email":
          errorLabel.textContent =
            "Invalid email address. Please check your input.";
          break;
        case "auth/user-not-found":
          errorLabel.textContent =
            "No user found with this email. Please register first.";
          break;
        case "auth/wrong-password":
          errorLabel.textContent = "Incorrect password. Please try again.";
          break;
        default:
          errorLabel.textContent = "An error occurred. Please try again later.";
      }
    });
});
