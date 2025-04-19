import { firebaseCRUD } from "./firebase-crud.js";

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

    img.src = data.userImg
      ? data.userImg
      : "../assets/img/icons8_male_user_480px_1";

    try {
      showLoading(true);
      const dates = await getAllIncidentDates();
    } catch (error) {
      console.error("Error loading history:", error);
      showError("Failed to load history. Please try again later.");
    } finally {
      showLoading(false);
    }
  } catch (err) {
    console.error("Failed to get user data from IndexedDB", err);
  }
});

async function getAllIncidentDates() {
  const userId = localStorage.getItem("userId");
  if (!userId) return;

  const container = document.querySelector(".card-container .row");
  container.innerHTML = "";

  try {
    const data = await firebaseCRUD.queryData(
      "completeAttendanceTbl",
      "userId",
      "==",
      userId
    );

    console.log("Fetched data:", data);

    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = `<p class="text-center text-muted">No attendance records found.</p>`;
      return;
    }

    data.forEach((record) => {
      if (!record.date) return;

      const date = new Date(record.date);
      const day = date
        .toLocaleDateString("en-US", { weekday: "short" })
        .toUpperCase();
      const readableDate = date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      const card = document.createElement("div");
      card.className = "col-12 col-md-6 col-lg-4 mb-2 px-2";

      card.innerHTML = `
        <a href="" class="history-card mb-2" data-bs-toggle="modal" data-bs-target="#viewHistoryModal">
          
          <span>${day}</span>
          <span class="separator"></span>
          <span class="date">${readableDate}</span>
        </a>
      `;

      container.appendChild(card);
    });
  } catch (error) {
    console.error("Error fetching history dates:", error);
    throw new Error(`Failed to fetch data: ${error.message}`);
  }
}

// function filterDatesBySearch(searchDate, allDates) {
//   if (!searchDate) {
//     populateDates(allDates);
//     return;
//   }

//   const filteredDates = allDates.filter((dateInfo) => {
//     return dateInfo.rawDate === searchDate;
//   });

//   populateDates(filteredDates);
// }

function showLoading(show) {
  const loader = document.getElementById("loading-indicator") || createLoader();
  loader.style.display = show ? "block" : "none";
}

function createLoader() {
  const loader = document.createElement("div");
  loader.id = "loading-indicator";
  loader.className = "text-center py-4";
  loader.innerHTML =
    '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
  document.querySelector(".card-container").prepend(loader);
  return loader;
}

function showError(message) {
  const container = document.querySelector(".card-container .row");
  container.innerHTML = `
        <div class="col-12 text-center py-4">
            <i class="bi bi-exclamation-triangle-fill fs-1 text-danger"></i>
            <p class="mt-2">${message}</p>
            <button class="btn btn-primary mt-2" onclick="location.reload()">Retry</button>
        </div>
    `;
}
