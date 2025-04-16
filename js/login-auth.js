import { auth, signInWithEmailAndPassword } from "./firebase-config.js";
import { firebaseCRUD } from "./firebase-crud.js";

const login = document.getElementById("login-button");
const errorLabel = document.getElementById("error-label");

login.addEventListener("click", (e) => {
  e.preventDefault();
  errorLabel.textContent = "";
  const email = document.getElementById("username").value;
  const password = document.getElementById("password-input").value;

  login.disabled = true;
  login.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Logging in...`;
  signInWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
      const user = userCredential.user;

      if (user.emailVerified === false) {
        errorLabel.textContent = "Please verify your email address.";
        errorLabel.classList.add("text-danger");
        login.disabled = false;
        login.textContent = "LOGIN";
        return;
      }

      localStorage.setItem("userId", user.uid);
      await fetchAndCacheUserData();
      window.location.href = "/pages/dashboard.html";
      login.disabled = false;
      login.textContent = "LOGIN";
    })
    .catch((error) => {
      const errorCode = error.code;
      let errorMessage = "An unknown error occurred.";

      switch (errorCode) {
        case "auth/invalid-email":
          errorMessage = "Invalid email address.";
          break;
        case "auth/user-disabled":
          errorMessage = "This account has been disabled.";
          break;
        case "auth/user-not-found":
          errorMessage = "User not found. Please check your email.";
          break;
        case "auth/wrong-password":
          errorMessage = "Incorrect password.";
          break;
        case "auth/too-many-requests":
          errorMessage =
            "Too many attempts. Try again later or reset your password.";
          break;
        case "auth/network-request-failed":
          errorMessage = "Network error. Check your connection.";
          break;
        case "auth/invalid-credential":
          errorMessage = "Invalid login credentials.";
          break;
        case "auth/requires-recent-login":
          errorMessage = "Session expired. Please log in again.";
          break;
        case "auth/operation-not-allowed":
          errorMessage = "Email/password login is not enabled.";
          break;
      }

      login.disabled = false;
      login.textContent = "LOGIN";
      errorLabel.textContent = errorMessage;
      errorLabel.classList.add("text-danger");
    });
});

async function fetchAndCacheUserData() {
  const uid = localStorage.getItem("userId");
  if (!uid) {
    console.error("User UID not found in localStorage");
    return;
  }

  try {
    const userDocs = await firebaseCRUD.queryData(
      "students",
      "userId",
      "==",
      uid
    );

    if (!userDocs || userDocs.length === 0) {
      console.warn("No matching user data found in Firestore.");
      return;
    }

    const userData = userDocs[0];

    await window.dbReady;
    await crudOperations.createData("studentInfoTbl", userData);

    console.log("User data cached to IndexedDB:", userData);
  } catch (err) {
    console.error("Failed to fetch and cache user data:", err);
  }
}
