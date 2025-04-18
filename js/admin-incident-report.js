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
});

async function getAllIncidentDates() {
  try {
    const uniqueDates = new Map();

    // First get all user documents from the root incidentreports collection
    const usersSnapshot = await firebaseCRUD.getAllData("incidentreports");

    // For each user, get their date subcollections
    for (const userDoc of usersSnapshot) {
      try {
        // Get all date documents under this user
        const datesSnapshot = await firebaseCRUD.getAllData(
          `incidentreports/${userDoc.id}`
        );

        // Each date document's ID is the date string
        datesSnapshot.forEach((dateDoc) => {
          const dateStr = dateDoc.id;
          if (!uniqueDates.has(dateStr)) {
            uniqueDates.set(dateStr, {
              rawDate: dateStr,
              date: formatDate(new Date(dateStr)),
              day: getDayOfWeek(new Date(dateStr)),
            });
          }
        });
      } catch (error) {
        console.error(`Error fetching dates for user ${userDoc.id}:`, error);
        continue; // Skip to next user if there's an error
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
  container.innerHTML = ""; // Clear existing content

  if (dates.length === 0) {
    container.innerHTML = `
            <div class="col-12 text-center py-4">
                <i class="bi bi-exclamation-circle fs-1 text-muted"></i>
                <p class="mt-2">No incident reports found</p>
            </div>
        `;
    return;
  }

  dates.forEach((dateInfo) => {
    const col = document.createElement("div");
    col.className = "col-12 col-md-6 col-lg-4 mb-2 px-2";

    const card = document.createElement("a");
    // Link to the date-specific page (no user ID needed)
    card.href = `admin-incident-report-student.html?date=${dateInfo.rawDate}`;
    card.className = "history-card mb-2";

    card.innerHTML = `
            <span>${dateInfo.day}</span>
            <span class="separator"></span>
            <span class="date">${dateInfo.date}</span>
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
