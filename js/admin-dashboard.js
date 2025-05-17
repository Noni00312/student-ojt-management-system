import { firebaseCRUD } from "./firebase-crud.js";


function announcementCard(announcement) {
  return `
    <div class="announcement-item mb-3">
      <div class="announcement-content">
        <h5>${announcement.title}</h5>
        <p style="margin-bottom:10px">${announcement.content ? announcement.content.substring(0,120) : ""}${announcement.content && announcement.content.length > 120 ? "..." : ""}</p>
        <div class="announcement-meta d-flex gap-2 flex-wrap">
          <span class="badge bg-light text-dark"><i class="bi bi-calendar me-1"></i>
            ${announcement.updatedAt ? announcement.updatedAt.substring(0,10) : ""}
          </span>
          <span class="badge bg-light text-dark"><i class="bi bi-person me-1"></i>
            Admin
          </span>
          ${announcement.url ? `<a href="${announcement.url}" target="_blank" class="badge bg-primary text-white text-decoration-none"><i class="bi bi-link me-1"></i>Link</a>` : ""}
        </div>
      </div>
    </div>
  `;
}


async function fetchAndRenderLatestAnnouncements() {
  const listContainer = document.getElementById("dashboard-announcements-list");
  const loadingDiv = document.getElementById("dashboard-announcements-loading");
  
  if (loadingDiv) loadingDiv.style.display = "block";
  
  try {
    let announcements = await firebaseCRUD.getAllData("announcements");
    if (Array.isArray(announcements)) {
      announcements = announcements
        .filter(a => a && a.content && a.updatedAt)
        .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))
        .slice(0, 3);
      
      if (loadingDiv) loadingDiv.style.display = "none";
      
      if (announcements.length === 0) {
        listContainer.innerHTML = `
          <div class="text-center text-muted py-5">
            <i class="bi bi-megaphone fs-1"></i>
            <p class="mt-2 mb-0">No announcements</p>
          </div>
        `;
      } else {
        listContainer.innerHTML = announcements.map(announcementCard).join("");
      }
    } else {
      if (loadingDiv) loadingDiv.style.display = "none";
      listContainer.innerHTML = `<div class="py-4 text-center text-danger">Unable to load announcements.</div>`;
    }
  } catch (e) {
    if (loadingDiv) loadingDiv.style.display = "none";
    listContainer.innerHTML = `<div class="text-center text-danger py-4">Failed to load announcements.</div>`;
    console.error("Error fetching announcements:", e);
  }
}

document.addEventListener("DOMContentLoaded", async function () {
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

  try {
    const companies = await firebaseCRUD.getAllData("company");
    const companyCount = Array.isArray(companies) ? companies.length : 0;
    document.getElementById("companies-count").innerText = companyCount;

    const students = await firebaseCRUD.getAllData("students");
    const ojtCount = Array.isArray(students)
      ? students.filter((student) => String(student.userType).toLowerCase() !== "admin").length
      : 0;
    document.getElementById("ojts-count").innerText = ojtCount;
  } catch (err) {
    console.error("Failed to fetch dashboard stats from Firebase:", err);
    document.getElementById("companies-count").innerText = "N/A";
    document.getElementById("ojts-count").innerText = "N/A";
  }
  
  fetchAndRenderLatestAnnouncements();
});
