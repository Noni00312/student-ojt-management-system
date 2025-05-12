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
    document.getElementById("announcement-content").value = editItem.content || "";
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
    image = await getBase64(fileInput.files[0]);
  } else if (!image || image === window.location.href) {
    image = "";
  }

  if (!title || !content) {
    alert("Title and content are required.");
    setLoading(btn, false);
    return;
  }

  const data = {
    title,
    content,
    url,
    image,
    updatedAt: new Date().toISOString()
  };

  try {
    if (id) {
      await firebaseCRUD.updateData("announcements", id, data);
    } else {
      data.createdAt = new Date().toISOString();
      await firebaseCRUD.createData("announcements", data);
    }
    bootstrap.Modal.getInstance(document.getElementById(MODAL_ID)).hide();
    fetchAnnouncements(document.getElementById("announcementSearch").value.trim());
  } catch (error) {
    alert("Failed to save announcement: " + error.message);
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
    bootstrap.Modal.getInstance(document.getElementById(DELETE_MODAL_ID)).hide();
    fetchAnnouncements(document.getElementById("announcementSearch").value.trim());
    currentDeleteId = null;
  } catch (error) {
    alert("Failed to delete announcement: " + error.message);
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
        ${a.image ? `
          <div class="announcement-image-container">
            <img src="${a.image}" class="announcement-image" alt="Announcement Image">
            <div class="announcement-overlay"></div>
          </div>
        ` : `
          <div class="no-announcement-image">
            <i class="bi bi-megaphone"></i>
            <div class="announcement-overlay"></div>
          </div>
        `}
        <div class="announcement-content">
          <div class="announcement-info">
            <h5>${a.title ? a.title : "(No title)"}</h5>
            <p>${a.content ? a.content.substring(0, 100) + (a.content.length>50 ? "..." : "") : ""}</p>
            ${a.url ? `<a href="${a.url}" target="_blank" class="text-white announcement-link"><i class="bi bi-link"></i><small>Visit Link</small></a>` : ""}
          </div>
          <div class="announcement-actions">
            <button data-action="edit" data-id="${a.id}" title="Edit"><i class="bi bi-pencil-fill"></i></button>
            <button data-action="delete" data-id="${a.id}" title="Delete"><i class="bi bi-trash-fill"></i></button>
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

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

    const img = document.getElementById("user-img");

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


  document.getElementById("announcementSearch").addEventListener("input", (e) => {
    fetchAnnouncements(e.target.value);
  });

  document.getElementById("add-announcement-btn").addEventListener("click", () => {
    openModal();
  });

  document.getElementById("announcement-image").addEventListener("change", async function () {
    if (this.files && this.files[0]) {
      const base64 = await getBase64(this.files[0]);
      if (base64) {
        document.getElementById("preview-image").src = base64;
        document.getElementById("preview-image").style.display = "block";
      }
    }
  });

  document.getElementById(FORM_ID).addEventListener("submit", saveAnnouncement);

  document.getElementById("delete-announcement-confirm-btn").addEventListener("click", deleteAnnouncement);

  document.getElementById(LIST_ID).addEventListener("click", (e) => {
    const target = e.target.closest("button");
    if (!target) return;
    const action = target.getAttribute("data-action");
    const id = target.getAttribute("data-id");
    if (action === "edit") {
      fetchAnnouncements().then((anns) => {
        const found = anns.find(a => a.id === id);
        if (found) openModal(found);
      });
    } else if (action === "delete") {
      openDeleteModal(id);
    }
  });

  fetchAnnouncements();
});