import { firebaseCRUD } from "./firebase-crud.js";

document.addEventListener("DOMContentLoaded", async function () {
  try {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.error("No userId found in localStorage");
      window.location.href = "/pages/login.html";
      return;
    }

    await window.dbReady;

    const userImg = document.querySelector(".profile-icon");
    const userName = document.querySelector("#profile-name");
    const adminId = document.getElementById("admin-id");
    const accessLevel = document.getElementById("access-level");
    const createdAt = document.getElementById("account-created");
    const lastLogin = document.getElementById("last-login");
    const editButton = document.getElementById("edit-button");
    const editProfileModal = document.getElementById("editProfileModal");
    const imgButton = document.getElementById("img-button");
    const logoutButton = document.getElementById("logout-button");

    setupEditButton(editButton);

    let userData;
    try {
      const dataArray = await crudOperations.getByIndex(
        "studentInfoTbl",
        "userId",
        userId
      );
      userData = Array.isArray(dataArray) ? dataArray[0] : dataArray;

      if (navigator.onLine && userData) {
        try {
          const firebaseData = await firebaseCRUD.queryData(
            "students",
            "userId",
            "==",
            userId
          );

          if (firebaseData && firebaseData.length > 0) {
            const mergedData = {
              ...userData,
              ...firebaseData[0],
              id: firebaseData[0].id || userData.id,
            };

            await crudOperations.updateData(
              "studentInfoTbl",
              mergedData.id || userId,
              mergedData
            );

            userData = mergedData;
          }
        } catch (error) {
          console.error("Firebase sync error:", error);
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }

    if (userData) {
      updateProfileUI(userData);
      populateEditForm(userData);
    } else {
      console.warn("No user data found");
    }

    const editForm = document.getElementById("adminForm");
    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const submitButton = editForm.querySelector("button[type='submit']");
      submitButton.disabled = true;
      submitButton.innerHTML =
        '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Updating...';

      try {
        const formData = new FormData(editForm);
        const updatedData = {
          firstName: formData.get("first-name")?.trim() || "",
          adminId: userData.adminId || userId,
          updatedAt: new Date().toISOString(),
          userId: userId,
        };

        const docId = userData?.id || userId;
        await crudOperations.updateData("studentInfoTbl", docId, updatedData);

        if (navigator.onLine) {
          await firebaseCRUD.updateData("students", docId, updatedData);
        }

        const updatedDataArray = await crudOperations.getByIndex(
          "studentInfoTbl",
          "userId",
          userId
        );
        const updatedUserData = Array.isArray(updatedDataArray)
          ? updatedDataArray[0]
          : updatedDataArray;
        updateProfileUI(updatedUserData);

        const modal = bootstrap.Modal.getInstance(editProfileModal);
        modal.hide();
        Swal.fire({
          icon: "success",
          title: "Profile Updated",
          text: "Your profile has been updated successfully!",
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error("Update error:", error);
        Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: "An error occurred while updating your profile",
        });
      } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = "<span>Update Profile</span>";
      }
    });

    const imgInput = document.createElement("input");
    imgInput.type = "file";
    imgInput.accept = "image/*";
    imgInput.style.display = "none";
    document.body.appendChild(imgInput);

    imgButton.addEventListener("click", (e) => {
      e.preventDefault();
      imgInput.click();
    });

    imgInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const editProfileImg = document.querySelector(".modal-profile-icon");
      const previewUrl = URL.createObjectURL(file);
      editProfileImg.src = previewUrl;

      try {
        const base64Image = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const docId = userData?.id || userId;
        await crudOperations.updateData("studentInfoTbl", docId, {
          userImg: base64Image,
        });

        if (navigator.onLine) {
          await firebaseCRUD.updateData("students", docId, {
            userImg: base64Image,
          });
        }

        userImg.src = base64Image;
        editProfileImg.src = base64Image;
        URL.revokeObjectURL(previewUrl);
        location.reload();
        Swal.fire({
          icon: "success",
          title: "Image Updated",
          text: "Your profile image has been updated!",
          timer: 1500,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error("Image upload error:", error);
        Swal.fire({
          icon: "error",
          title: "Upload Failed",
          text: "Failed to update profile image",
        });
        editProfileImg.src = userImg.src;
      }
    });

    logoutButton.addEventListener("click", async function (e) {
      e.preventDefault();

      if (!navigator.onLine) {
        await Swal.fire({
          icon: "error",
          title: "No Internet",
          text: "You need internet connection to logout",
        });
        return;
      }

      const result = await Swal.fire({
        title: "Logout?",
        text: "Are you sure you want to logout?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#590f1c",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Yes, logout!",
      });

      if (result.isConfirmed) {
        try {
          Swal.fire({
            title: "Logging out...",
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            },
          });

          await crudOperations.clearTable("studentInfoTbl");
          localStorage.removeItem("userId");
          localStorage.removeItem("userEmail");
          localStorage.removeItem("userToken");

          window.location.href = "/pages/login.html";
        } catch (error) {
          console.error("Logout error:", error);
          Swal.fire({
            icon: "error",
            title: "Logout Failed",
            text: "An error occurred during logout",
          });
        }
      }
    });
  } catch (error) {
    console.error("Initialization error:", error);
    Swal.fire({
      icon: "error",
      title: "Initialization Error",
      text: "Failed to initialize profile page",
    }).then(() => {
      window.location.href = "/pages/login.html";
    });
  }
});

function setupEditButton(editButton) {
  const updateButtonState = () => {
    if (!navigator.onLine) {
      editButton.classList.add("disabled", "btn-disabled");
      editButton.setAttribute("title", "Edit requires internet connection");
      editButton.setAttribute("data-bs-toggle", "offline");
      editButton.removeAttribute("data-bs-target");
      editButton.style.cursor = "not-allowed";
      editButton.style.opacity = "0.5";
    } else {
      editButton.classList.remove("disabled", "btn-disabled");
      editButton.setAttribute("title", "Edit Profile");
      editButton.setAttribute("data-bs-toggle", "modal");
      editButton.setAttribute("data-bs-target", "#editProfileModal");
      editButton.style.cursor = "pointer";
      editButton.style.opacity = "1";
    }
  };

  updateButtonState();

  editButton.addEventListener("click", (e) => {
    if (!navigator.onLine) {
      e.preventDefault();
      e.stopPropagation();
      window.location.href = "no-internet.html";
      return false;
    }
  });

  window.addEventListener("online", updateButtonState);
  window.addEventListener("offline", updateButtonState);

  const modal = new bootstrap.Modal(
    document.getElementById("editProfileModal")
  );
  document
    .getElementById("editProfileModal")
    .addEventListener("show.bs.modal", (e) => {
      if (!navigator.onLine) {
        e.preventDefault();
        alert(
          "Editing profile requires an internet connection. Please check your network and try again."
        );
        modal.hide();
      }
    });
}

function updateProfileUI(data) {
  const userImg = document.querySelector(".profile-icon");
  const userName = document.querySelector("#profile-name");
  const adminId = document.getElementById("admin-id");
  const accessLevel = document.getElementById("access-level");
  const createdAt = document.getElementById("account-created");
  const lastLogin = document.getElementById("last-login");

  if (data.userImg) userImg.src = data.userImg;
  userName.textContent = data.firstName || "";
  if (data.adminId) adminId.textContent = data.adminId;
  if (data.accessLevel) accessLevel.textContent = data.accessLevel;
  if (data.createdAt) createdAt.textContent = formatDateTime(data.createdAt);
  if (data.lastLogin) lastLogin.textContent = formatDateTime(data.lastLogin);
}

function populateEditForm(data) {
  const firstNameInput = document.getElementById("modal-first-name");
  const editProfileImg = document.querySelector(".modal-profile-icon");

  if (firstNameInput && data.firstName)
    firstNameInput.value = data.firstName.trim();
  if (editProfileImg && data.userImg) editProfileImg.src = data.userImg;
}

function formatDateTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

document.addEventListener("DOMContentLoaded", function () {
  const logoutButton = document.getElementById("logout-button");

  function updateLogoutButtonState() {
    if (!navigator.onLine) {
      logoutButton.disabled = true;
      logoutButton.title = "Internet connection required to logout";
      logoutButton.style.cursor = "not-allowed";
      logoutButton.style.opacity = "0.6";
    } else {
      logoutButton.disabled = false;
      logoutButton.title = "";
      logoutButton.style.cursor = "pointer";
      logoutButton.style.opacity = "1";
    }
  }

  updateLogoutButtonState();

  window.addEventListener("online", updateLogoutButtonState);
  window.addEventListener("offline", updateLogoutButtonState);

  if (logoutButton) {
    logoutButton.addEventListener("click", async function (e) {
      e.preventDefault();

      if (!navigator.onLine) {
        alert("You need internet connection to logout");
        return;
      }

      const result = await Swal.fire({
        title: "Logout?",
        text: "Are you sure you want to logout?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#590f1c",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Yes, logout!",
      });

      if (result.isConfirmed) {
        try {
          logoutButton.disabled = true;
          logoutButton.innerHTML =
            '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging out...';

          await crudOperations.clearTable("studentInfoTbl");
          localStorage.removeItem("userId");
          localStorage.removeItem("userEmail");
          localStorage.removeItem("userToken");

          window.location.href = "/pages/login.html";
        } catch (error) {
          console.error("Logout error:", error);
          alert("An error occurred during logout");
          logoutButton.disabled = false;
          logoutButton.innerHTML = "Logout";
        }
      }
    });
  }
});
