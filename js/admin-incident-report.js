
import { firebaseCRUD } from "./firebase-crud.js";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    showLoading(true);
    const dates = await getAllIncidentDates();
    populateDates(dates);

    document
      .getElementById("incident-search-input")
      .addEventListener("change", (e) => {
        filterDatesBySearch(e.target.value, dates);
      });
  } catch (error) {
    console.error("Error loading incident reports:", error);
    showError("Failed to load incident reports. Please try again later.");
  } finally {
    showLoading(false);
  }

  
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

/**
 * Fetch all incident report documents, extract unique dates from the 'date' field.
 * @returns {Array} Array of unique date objects sorted by date descending.
 */
async function getAllIncidentDates() {
  try {
    const uniqueDates = new Map();

    const reports = await firebaseCRUD.getAllData("incidentreports");

    for (const report of reports) {
      const dateStr = report.date; 
      if (!dateStr) continue;
      if (!uniqueDates.has(dateStr)) {
        uniqueDates.set(dateStr, {
          rawDate: dateStr,
          date: formatDate(new Date(dateStr)),
          day: getDayOfWeek(new Date(dateStr)),
        });
      }
    }

    return Array.from(uniqueDates.values()).sort(
      (a, b) => new Date(b.rawDate) - new Date(a.rawDate)
    );
  } catch (error) {
    console.error("Error fetching incident dates:", error);
    throw new Error(`Failed to fetch data: ${error.message}`);
  }
}

function formatDate(date) {
  const options = { year: "numeric", month: "long", day: "numeric" };
  return date.toLocaleDateString("en-US", options);
}

function getDayOfWeek(date) {
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  return days[date.getDay()];
}

function populateDates(dates) {
  const container = document.querySelector(".card-container .row");
  container.innerHTML = "";

  if (dates.length === 0) {
    container.innerHTML = `
      <div class="position-absolute top-50 start-50 translate-middle col-12 text-center py-4">
        <i class="bi bi-exclamation-circle fs-1 text-muted"></i>
        <h6 class="mt-2">No Incident Reports Available</h6>
        <p class="mt-1">No incident reports have been sent on any of the dates.</p>
      </div>
    `;
    return;
  }

  dates.forEach((dateInfo) => {
    const col = document.createElement("div");
    col.className = "col-12 col-md-6 col-lg-4 mb-2 px-2 text-light";

    const card = document.createElement("a");
    card.href = `admin-incident-report-student.html?date=${dateInfo.rawDate}`;
    card.className = "history-card mb-2";

    card.innerHTML = `
      <span class="text-light">${dateInfo.day}</span>
      <span class="separator text-light"></span>
      <span class="date text-light">${dateInfo.date}</span>
    `;

    col.appendChild(card);
    container.appendChild(col);
  });
}

function filterDatesBySearch(searchDate, allDates) {
  if (!searchDate) {
    populateDates(allDates);
    return;
  }

  const filteredDates = allDates.filter((dateInfo) => {
    return dateInfo.rawDate === searchDate;
  });

  populateDates(filteredDates);
}

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
