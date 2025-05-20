import { firebaseCRUD } from "./firebase-crud.js";
import { getDoc, doc } from "./firebase-config.js";
import { db } from "./firebase-config.js";

document.addEventListener("click", function (event) {
  const clickedImg = event.target;

  if (
    clickedImg.tagName === "IMG" &&
    (clickedImg.id === "morning-time-in-img" ||
      clickedImg.id === "morning-time-out-img" ||
      clickedImg.id === "afternoon-time-in-img" ||
      clickedImg.id === "afternoon-time-out-img")
  ) {
    const modalImage = document.getElementById("modalImage");
    modalImage.src = clickedImg.src;

    const imageModal = new bootstrap.Modal(
      document.getElementById("imageModal")
    );
    imageModal.show();
  }
});

function resetViewHistoryModal() {
  const imgIds = [
    "morning-time-in-img",
    "morning-time-out-img",
    "afternoon-time-in-img",
    "afternoon-time-out-img",
  ];
  const timeIds = [
    "morning-in-time",
    "morning-out-time",
    "afternoon-in-time",
    "afternoon-out-time",
  ];

  imgIds.forEach((id) => (document.getElementById(id).src = ""));
  timeIds.forEach((id) => (document.getElementById(id).textContent = ""));
}

document
  .getElementById("close-button")
  .addEventListener("click", resetViewHistoryModal);

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

let allAttendanceDates = [];

document
  .getElementById("history-search-input")
  .addEventListener("input", (e) => {
    const selectedDate = e.target.value;
    filterDatesBySearch(selectedDate, allAttendanceDates);
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

    data.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = `<div class="position-absolute top-50 start-50 translate-middle align-items-center col-12 text-center py-4">
                <i class="bi bi-exclamation-circle fs-1 text-muted"></i>
                <h6 class="mt-2">No History Found</h6>
                <p class="mt-1">No attendance records found.</p>
            </div>`;
      return;
    }

    allAttendanceDates = data.map((record) => {
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
      <a href="#" class="history-card mb-2" data-bs-toggle="modal" data-bs-target="#viewHistoryModal" data-date="${rawDate}">
        <span>${day}</span>
        <span class="separator"></span>
        <span class="date">${readableDate}</span>
      </a>
    `;

    container.appendChild(card);

    const userId = localStorage.getItem("userId");

    card.querySelector("a").addEventListener("click", (e) => {
      e.preventDefault();
      const selectedDate = e.currentTarget.getAttribute("data-date");
      populateAttendanceModal(userId, selectedDate);
    });
  });
}

async function populateAttendanceModal(userId, date) {
  const logData = await getAttendanceByDate(userId, date);
  const onlineResults = await firebaseCRUD.queryData(
    "completeAttendanceTbl",
    "userId",
    "==",
    userId
  );
  const onlineEntry = onlineResults.find((entry) => entry.date === date);
  const badgeContainer = document.getElementById("badge-container");

  const checkStatus = () => {
    if (onlineEntry.status === "absent") {
      badgeContainer.innerHTML = `
          <div
            class="badge w-100 my-3 d-flex align-item-center justify-content-center bg-danger"
            id="badge"
          >
            <p class="p-2 m-0">Absent</p>
          </div>
      `;
    } else {
      badgeContainer.innerHTML = ``;
    }
  };

  checkStatus();

  const setLogData = (log, timeId, imgId) => {
    const timeEl = document.getElementById(timeId);
    const imgEl = document.getElementById(imgId);

    if (log) {
      const logTime = log.timestamp
        ? new Date(log.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "—";
      timeEl.textContent = logTime;
      imgEl.src = log.image || "../assets/img/icons8_no_image_500px.png";
    } else {
      timeEl.textContent = "No log";
      imgEl.src = "../assets/img/icons8_no_image_500px.png";
    }
  };

  setLogData(logData.morningTimeIn, "morning-in-time", "morning-time-in-img");
  setLogData(
    logData.morningTimeOut,
    "morning-out-time",
    "morning-time-out-img"
  );
  setLogData(
    logData.afternoonTimeIn,
    "afternoon-in-time",
    "afternoon-time-in-img"
  );
  setLogData(
    logData.afternoonTimeOut,
    "afternoon-out-time",
    "afternoon-time-out-img"
  );
}

async function getAttendanceByDate(userId, dateStr) {
  try {
    const basePath = ["attendancelogs", userId, dateStr];

    const getLog = async (logType) => {
      const logRef = doc(db, ...basePath, logType);
      const snap = await getDoc(logRef);
      return snap.exists() ? snap.data() : null;
    };

    const [morningIn, morningOut, afternoonIn, afternoonOut] =
      await Promise.all([
        getLog("morningTimeIn"),
        getLog("morningTimeOut"),
        getLog("afternoonTimeIn"),
        getLog("afternoonTimeOut"),
      ]);

    return {
      morningTimeIn: morningIn?.morningTimeIn || null,
      morningTimeOut: morningOut?.morningTimeOut || null,
      afternoonTimeIn: afternoonIn?.afternoonTimeIn || null,
      afternoonTimeOut: afternoonOut?.afternoonTimeOut || null,
    };
  } catch (error) {
    console.error("Error fetching logs by date:", error);
    return null;
  }
}
