import { firebaseCRUD } from "./firebase-crud.js";

const LIST_ID = "announcements-list";
const FORM_ID = "announcement-form";
const MODAL_ID = "addAnnouncementModal";
const DELETE_MODAL_ID = "deleteAnnouncementModal";

let currentEditId = null;
let currentDeleteId = null;

function resetForm() {
  document.getElementById(FORM_ID).reset();
  document.getElementById("announcementId").value = "";
  document.getElementById("preview-image").src = "";
  document.getElementById("preview-image").style.display = "none";
  currentEditId = null;
}

function openModal(editItem = null) {
  resetForm();
  if (editItem) {
    currentEditId = editItem.id;
    document.getElementById("announcementId").value = editItem.id;
    document.getElementById("announcement-title").value = editItem.title || "";
    document.getElementById("announcement-link").value = editItem.url || "";
    document.getElementById("announcement-content").value =
      editItem.content || "";
    if (editItem.image) {
      document.getElementById("preview-image").src = editItem.image;
      document.getElementById("preview-image").style.display = "block";
    }
  }
  new bootstrap.Modal(document.getElementById(MODAL_ID)).show();
}

function openDeleteModal(id) {
  currentDeleteId = id;
  new bootstrap.Modal(document.getElementById(DELETE_MODAL_ID)).show();
}

function setLoading(el, loading) {
  if (!el) return;
  el.disabled = loading;
  if (loading) {
    el.innerHTML = `<span class="spinner-border spinner-border-sm" role="status"></span>`;
  } else {
    if (el.id === "announcement-save-btn") {
      el.textContent = "Save";
    } else if (el.id === "delete-announcement-confirm-btn") {
      el.textContent = "Delete";
    }
  }
}

function showLoading(show) {
  const loader = document.getElementById("loading-indicator") || createLoader();
  if (loader) {
    loader.style.display = show ? "block" : "none";
  }
}

function createLoader() {
  const loader = document.createElement("div");
  loader.id = "loading-indicator";
  loader.className = "text-center py-4";
  loader.style.display = "none";
  loader.innerHTML = `
    <div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
  `;

  const container = document.getElementById(LIST_ID);
  if (container) {
    container.prepend(loader);
    return loader;
  }
  return null;
}

function showError(message) {
  const container = document.getElementById(LIST_ID);
  container.innerHTML = `
    <div class="text-center py-5">
      <i class="bi bi-exclamation-triangle-fill text-danger fs-1"></i>
      <p class="mt-3">${message}</p>
      <button class="btn btn-primary mt-2" onclick="window.location.reload()">
        Try Again
      </button>
    </div>
  `;
}

async function fetchAnnouncements(search = "") {
  showLoading(true);
  let announcements = [];
  try {
    announcements = await firebaseCRUD.getAllData("announcements");
    if (search) {
      const lower = search.toLowerCase();
      announcements = announcements.filter(
        (a) =>
          (a.title && a.title.toLowerCase().includes(lower)) ||
          (a.content && a.content.toLowerCase().includes(lower)) ||
          (a.url && a.url.toLowerCase().includes(lower))
      );
    }
    announcements.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0);
      const dateB = new Date(b.updatedAt || b.createdAt || 0);
      return dateB - dateA;
    });
    renderAnnouncements(announcements);
  } catch (error) {
    showError(error.message || "Failed to load announcements");
    console.error("Error loading announcements:", error);
  } finally {
    showLoading(false);
  }
  return announcements;
}

async function saveAnnouncement(e) {
  e.preventDefault();
  const btn = document.getElementById("announcement-save-btn");
  setLoading(btn, true);

  const id = document.getElementById("announcementId").value;
  const title = document.getElementById("announcement-title").value.trim();
  const content = document.getElementById("announcement-content").value.trim();
  const url = document.getElementById("announcement-link").value.trim();
  const fileInput = document.getElementById("announcement-image");
  let image = document.getElementById("preview-image").src || "";

  if (fileInput && fileInput.files && fileInput.files[0]) {
    image = await convertImageTo500KB(fileInput.files[0]);
  } else if (!image || image === window.location.href) {
    image = "";
  }

  if (!title || !content) {
    Swal.fire({
      icon: "warning",
      title: "All Field Is Required",
      text: "Title and content are required.",
      confirmButtonColor: "#590f1c",
    });
    setLoading(btn, false);
    return;
  }

  const data = {
    title,
    content,
    url,
    image,
    updatedAt: new Date().toISOString(),
  };

  try {
    if (id) {
      await firebaseCRUD.updateData("announcements", id, data);
    } else {
      data.createdAt = new Date().toISOString();
      await firebaseCRUD.createData("announcements", data);
    }
    bootstrap.Modal.getInstance(document.getElementById(MODAL_ID)).hide();
    fetchAnnouncements(
      document.getElementById("announcementSearch").value.trim()
    );
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Update Failed",
      text: `Failed to save announcement: ${error.message}`,
      confirmButtonColor: "#590f1c",
    });
  } finally {
    setLoading(btn, false);
  }
}

async function deleteAnnouncement() {
  if (!currentDeleteId) return;
  const btn = document.getElementById("delete-announcement-confirm-btn");
  setLoading(btn, true);
  try {
    await firebaseCRUD.deleteData("announcements", currentDeleteId);
    bootstrap.Modal.getInstance(
      document.getElementById(DELETE_MODAL_ID)
    ).hide();
    fetchAnnouncements(
      document.getElementById("announcementSearch").value.trim()
    );
    currentDeleteId = null;
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Delete Failed",
      text: `Failed to delete announcement: ${error.message}`,
      confirmButtonColor: "#590f1c",
    });
  } finally {
    setLoading(btn, false);
  }
}

function renderAnnouncements(list) {
  const container = document.getElementById(LIST_ID);
  container.innerHTML = "";

  if (!Array.isArray(list) || list.length === 0) {
    container.innerHTML = `
      <div class="text-center text-muted py-5">
        <i class="bi bi-megaphone fs-1"></i>
        <p class="mt-2">No announcements found</p>
      </div>
    `;
    return;
  }

  list.forEach((a) => {
    const card = document.createElement("div");
    card.className = "col-12 col-md-6 col-lg-4 p-2";
    card.innerHTML = `
      <div class="card h-100 shadow announcement-card">
        ${
          a.image
            ? `
          <div class="announcement-image-container">
            <img src="${a.image}" class="announcement-image" alt="Announcement Image">
            <div class="announcement-overlay"></div>
          </div>
        `
            : `
          <div class="no-announcement-image">
            <i class="bi bi-megaphone"></i>
            <div class="announcement-overlay"></div>
          </div>
        `
        }
        <div class="announcement-content">
          <div class="announcement-info">
            <h5>${a.title ? a.title : "(No title)"}</h5>
            <p>${
              a.content
                ? a.content.substring(0, 100) +
                  (a.content.length > 50 ? "..." : "")
                : ""
            }</p>
            ${
              a.url
                ? `<a href="${a.url}" target="_blank" class="text-white announcement-link"><i class="bi bi-link"></i><small>Visit Link</small></a>`
                : ""
            }
          </div>
          <div class="announcement-actions">
            <button data-action="edit" data-id="${
              a.id
            }" title="Edit"><i class="bi bi-pencil-fill"></i></button>
            <button data-action="delete" data-id="${
              a.id
            }" title="Delete"><i class="bi bi-trash-fill"></i></button>
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

async function convertImageTo500KB(file, maxSizeKB = 500) {
  if (!file || !file.type.startsWith("image/")) return "";

  function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(","),
      mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]),
      n = bstr.length,
      u8arr = new Uint8Array(n);
    for (let i = 0; i < n; i++) u8arr[i] = bstr.charCodeAt(i);
    return new Blob([u8arr], { type: mime });
  }

  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  let currentBase64 = base64;
  let blob = dataURLtoBlob(currentBase64);

  if ((currentBase64.length * 3) / 4 / 1024 <= maxSizeKB) {
    return currentBase64;
  }

  let quality = 0.92;
  const minQuality = 0.4;
  const canvas = document.createElement("canvas");
  const img = document.createElement("img");

  return new Promise((resolve, reject) => {
    img.onload = function () {
      canvas.width = img.width;
      canvas.height = img.height;

      (function compressLoop() {
        canvas.getContext("2d").drawImage(img, 0, 0);
        let dataUrl = canvas.toDataURL("image/jpeg", quality);
        if (file.type === "image/png" && quality === 1) {
          dataUrl = canvas.toDataURL("image/png");
        }
        const newSizeKB = Math.ceil((dataUrl.length * 3) / 4 / 1024);

        if (newSizeKB <= maxSizeKB || quality <= minQuality) {
          resolve(dataUrl);
        } else {
          canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
          quality -= 0.07;
          compressLoop();
        }
      })();
    };
    img.onerror = function (e) {
      reject(e);
    };
    img.src = currentBase64;
  });
}

/**
 * Simple function to get base64 from a file
 * @param {File} file - The file to convert
 * @returns {Promise<string>} - Base64 string
 */
function getBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve("");
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

document.addEventListener("DOMContentLoaded", async function () {
  createLoader();

  try {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      console.error("No userId found in localStorage");
      return;
    }

    await window.dbReady;

    const img = document.getElementById("user-profile");

    const dataArray = await crudOperations.getByIndex(
      "studentInfoTbl",
      "userId",
      userId
    );

    const data = Array.isArray(dataArray) ? dataArray[0] : dataArray;

    if (data != null) {
      img.src = data.userImg
        ? data.userImg
        : "../assets/img/icons8_male_user_480px_1";
    } else {
      console.warn("No user data found for this user.");
    }
  } catch (err) {
    console.error("Failed to get user data from IndexedDB", err);
  }

  document
    .getElementById("announcementSearch")
    .addEventListener("input", (e) => {
      fetchAnnouncements(e.target.value);
    });

  document
    .getElementById("add-announcement-btn")
    .addEventListener("click", () => {
      openModal();
    });

  document
    .getElementById("announcement-image")
    .addEventListener("change", async function () {
      if (this.files && this.files[0]) {
        const base64 = await convertImageTo500KB(this.files[0]);
        if (base64) {
          document.getElementById("preview-image").src = base64;
          document.getElementById("preview-image").style.display = "block";
        }
      }
    });

  document.getElementById(FORM_ID).addEventListener("submit", saveAnnouncement);

  document
    .getElementById("delete-announcement-confirm-btn")
    .addEventListener("click", deleteAnnouncement);

  document.getElementById(LIST_ID).addEventListener("click", (e) => {
    const target = e.target.closest("button");
    if (!target) return;
    const action = target.getAttribute("data-action");
    const id = target.getAttribute("data-id");
    if (action === "edit") {
      fetchAnnouncements().then((anns) => {
        const found = anns.find((a) => a.id === id);
        if (found) openModal(found);
      });
    } else if (action === "delete") {
      openDeleteModal(id);
    }
  });

  fetchAnnouncements();
});
