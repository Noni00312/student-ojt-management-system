import { firebaseCRUD } from "./firebase-crud.js";

function convertTo12HourFormat(time24) {
  const [hour, minute] = time24.split(":").map(Number);

  const suffix = hour >= 12 ? "pm" : "am";
  const hour12 = hour % 12 || 12;

  const time = `${hour12.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;

  return [time, suffix];
}

function studentAnnouncementCard(announcement) {
  return `
    <div class="announcement-item mb-3">
      <div class="announcement-content">
        <p>${announcement.content ? announcement.content.substring(0,120) : ""}${announcement.content && announcement.content.length > 120 ? "..." : ""}</p>
        <div class="announcement-meta d-flex gap-2 flex-wrap">
          <span class="badge bg-light text-dark"><i class="bi bi-calendar me-1"></i>
            ${announcement.updatedAt ? announcement.updatedAt.substring(0,10) : ""}
          </span>
          ${announcement.url ? `<a href="${announcement.url}" target="_blank" class="badge bg-primary text-white text-decoration-none"><i class="bi bi-link me-1"></i>Link</a>` : ""}
        </div>
      </div>
    </div>
  `;
}


async function fetchAndRenderStudentLatestAnnouncements() {
  const listContainer = document.getElementById("student-dashboard-announcements-list");
  const loadingDiv = document.getElementById("student-dashboard-announcements-loading");
  
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
        listContainer.innerHTML = announcements.map(studentAnnouncementCard).join("");
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
    const companyName = document.getElementById("company-name");
    const companyAddress = document.getElementById("company-address");
    const morningTimeIn = document.getElementById("morning-time-in");
    const morningTimeInTt = document.getElementById("morning-time-in-tt");
    const morningTimeOut = document.getElementById("morning-time-out");
    const morningTimeOutTt = document.getElementById("morning-time-out-tt");

    const afternoonTimeIn = document.getElementById("afternoon-time-in");
    const afternoonTimeInTt = document.getElementById("afternoon-time-in-tt");
    const afternoonTimeOut = document.getElementById("afternoon-time-out");
    const afternoonTimeOutTt = document.getElementById("afternoon-time-out-tt");

    const dataArray = await crudOperations.getByIndex(
      "studentInfoTbl",
      "userId",
      userId
    );


    const data = Array.isArray(dataArray) ? dataArray[0] : dataArray;

    if (data != null) {
      const [morningInTime, morningInPeriod] = convertTo12HourFormat(
        data.morningTimeIn
      );
      const [morningOutTime, morningOutPeriod] = convertTo12HourFormat(
        data.morningTimeOut
      );
      const [afternoonInTime, afternoonInPeriod] = convertTo12HourFormat(
        data.afternoonTimeIn
      );
      const [afternoonOutTime, afternoonOutPeriod] = convertTo12HourFormat(
        data.afternoonTimeOut
      );

      img.src = data.userImg
        ? data.userImg
        : "../assets/img/icons8_male_user_480px_1";

      companyName.textContent = data.companyName;
      companyAddress.textContent = data.companyAddress;

      morningTimeIn.textContent = morningInTime;
      morningTimeInTt.textContent = morningInPeriod;

      morningTimeOut.textContent = morningOutTime;
      morningTimeOutTt.textContent = morningOutPeriod;

      afternoonTimeIn.textContent = afternoonInTime;
      afternoonTimeInTt.textContent = afternoonInPeriod;

      afternoonTimeOut.textContent = afternoonOutTime;
      afternoonTimeOutTt.textContent = afternoonOutPeriod;
    } else {
      console.warn("No user data found for this user.");
    }
  } catch (err) {
    console.error("Failed to get user data from IndexedDB", err);
  }
  
  fetchAndRenderStudentLatestAnnouncements();
});
