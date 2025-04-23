window.document.addEventListener("DOMContentLoaded", async () => {
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
      const companyName = await getAllByCompanyName();
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

let allAttendanceDates = [];

// document
//   .getElementById("admin-t-i-o-search-input")
//   .addEventListener("input", (e) => {
//     const selectedDate = e.target.value;
//     filterDatesBySearch(selectedDate, allAttendanceDates);
//   });

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

async function getAllByCompanyName() {
  const container = document.querySelector(".card-container .row");
  container.innerHTML = "";

  try {
    const { firebaseCRUD } = await import("./firebase-crud.js");
    const urlParams = new URLSearchParams(window.location.search);
    const date = urlParams.get("date");

    console.log(date);

    const data = await firebaseCRUD.queryData(
      "completeAttendanceTbl",
      "date",
      "==",
      date
    );

    data.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = `<p class="text-center text-muted">No attendance records found.</p>`;
      return;
    }

    const seenDates = new Set();
    const distinctData = data.filter((record) => {
      const dateStr = new Date(record.date).toLocaleDateString("en-CA");
      if (seenDates.has(dateStr)) return false;
      seenDates.add(dateStr);
      return true;
    });

    allAttendanceDates = distinctData.map((record) => {
      const date = new Date(record.date);
      const isoDate = date.toLocaleDateString("en-CA");
      const day = date
        .toLocaleDateString("en-US", { weekday: "short" })
        .toUpperCase();
      const readableDate = date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      return {
        rawDate: isoDate,
        day,
        readableDate,
        original: record,
      };
    });

    populateDates(allAttendanceDates);
  } catch (error) {
    console.error("Error fetching history dates:", error);
    throw new Error(`Failed to fetch data: ${error.message}`);
  }
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
function populateDates(dateList) {
  const container = document.querySelector(".card-container .row");
  container.innerHTML = "";

  if (dateList.length === 0) {
    container.innerHTML = `<div class="position-absolute top-50 start-50 translate-middle align-items-center col-12 text-center py-4">
                <i class="bi bi-exclamation-circle fs-1 text-muted"></i>
                <h6 class="mt-2">No History Found For This Date</h6>
                <p class="mt-1">Oops! There’s no attendance record for this date. Try picking another day from the calendar.</p>
            </div>`;
    return;
  }

  dateList.forEach(({ rawDate, day, readableDate }) => {
    const card = document.createElement("div");
    card.className = "col-12 col-md-6 col-lg-4 mb-2 px-2";

    card.innerHTML = `
      <a href="#" class="history-card mb-2" data-date="${rawDate}">
        <span>${day}</span>
        <span class="separator"></span>
        <span class="date">${readableDate}</span>
      </a>
    `;

    container.appendChild(card);

    card.querySelector("a").addEventListener("click", (e) => {
      e.preventDefault();
      // const selectedDate = e.currentTarget.getAttribute("data-date");
      // populateHistoryModal(selectedDate);

      console.log(e.currentTarget.getAttribute("data-date"));
    });
  });
}
