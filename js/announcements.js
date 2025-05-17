import { firebaseCRUD } from "./firebase-crud.js";

const LIST_ID = "announcements-list";

function showAnnouncementModal(announcement) {
  document.getElementById('viewAnnouncementLabel').innerText = announcement.title || "(No title)";
  document.getElementById('modal-announcement-title').value = announcement.title || "";
  document.getElementById('modal-announcement-content').value = announcement.content || "";
  document.getElementById('modal-announcement-date').innerText = announcement.updatedAt
    ? `Date: ${announcement.updatedAt.substring(0,10)}`
    : "";
  document.getElementById('modal-announcement-author').style.display = "";  // Always visible, or adjust if you have per-announcer
  if (announcement.url) {
    const link = document.getElementById('modal-announcement-link');
    link.style.display = "";
    link.href = announcement.url;
  } else {
    document.getElementById('modal-announcement-link').style.display = "none";
  }
  document.getElementById('modal-announcement-updated').innerText =
    announcement.updatedAt ? `Last updated: ${announcement.updatedAt}` : "";
  const imgBox = document.getElementById('modal-announcement-image');
  if (announcement.image) {
    imgBox.src = announcement.image;
    imgBox.style.display = "block";
  } else {
    imgBox.src = "";
    imgBox.style.display = "none";
  }
  new bootstrap.Modal(document.getElementById('viewAnnouncementModal')).show();
}

function showLoading(show) {
  let loader = document.getElementById("loading-indicator");
  if (!loader) {
    loader = document.createElement("div");
    loader.id = "loading-indicator";
    loader.className = "text-center py-4";
    loader.innerHTML = `
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    `;
    const container = document.getElementById(LIST_ID);
    if (container) container.prepend(loader);
  }
  loader.style.display = show ? "block" : "none";
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
      <div class="card h-100 shadow announcement-card" style="cursor:pointer;">
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
            <p class="mb-1">${a.content ? a.content.substring(0, 100) + (a.content.length > 50 ? "..." : "") : ""}</p>
            ${a.url ? `<a href="${a.url}" target="_blank" class="text-white announcement-link"><i class="bi bi-link"></i><small>Visit Link</small></a>` : ""}
            <button class="btn btn-outline-light btn-sm mt-2 w-100 view-announcement-btn" data-id="${a.id}"><i class="bi bi-eye"></i> View</button>
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  container.querySelectorAll(".view-announcement-btn").forEach(btn => {
    btn.addEventListener("click", function(e) {
      e.stopPropagation(); 
      const id = this.getAttribute("data-id");
      const announcement = list.find(an => an.id === id);
      if (announcement) {
        showAnnouncementModal(announcement);
      }
    });
  });
  
  container.querySelectorAll(".announcement-card").forEach(card => {
    card.addEventListener("click", function() {
      const id = this.querySelector(".view-announcement-btn").getAttribute("data-id");
      const announcement = list.find(an => an.id === id);
      if (announcement) {
        showAnnouncementModal(announcement);
      }
    });
  });
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

document.addEventListener("DOMContentLoaded", async function () {
  document.getElementById("announcementSearch").addEventListener("input", (e) => {
    fetchAnnouncements(e.target.value);
  });

  fetchAnnouncements();

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

});
