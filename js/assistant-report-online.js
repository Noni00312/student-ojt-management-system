import { firebaseCRUD } from "./firebase-crud.js";

const reportsContainer = document.getElementById("assistant-reports-container");
const reportSearchInput = document.getElementById("assistant-report-search-input");
const viewReportModal = document.getElementById("viewAssistantReportModal");
const reportTitleInput = document.getElementById("assistant-report-title");
const reportContentTextarea = document.getElementById("assistant-report-content");
const reportImagesContainer = document.getElementById("assistant-report-images-container");

document.addEventListener("DOMContentLoaded", async () => {
  try {
    showLoading(true);
    await displayReports();
    setupEventListeners();
    setupDateSearch(); 
  } catch (error) {
    console.error("Initialization error:", error);
    showError("Failed to load assistant reports. Please try again later.");
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

    console.log("User data from IndexedDB:", dataArray);

    const data = Array.isArray(dataArray) ? dataArray[0] : dataArray;

    if (data != null) {
      img.src = data.userImg;
    } else {
      console.warn("No user data found for this user.");
    }
  } catch (err) {
    console.error("Failed to get user data from IndexedDB", err);
  }
});

async function displayReports(filterDate = null) {
  try {
    showLoading(true);

    const userId = localStorage.getItem("userId");
    if (!userId) {
      throw new Error("User not authenticated");
    }

    let reports = await firebaseCRUD.queryData(
      "assistantreports",
      "userId",
      "==",
      userId
    );

    if (filterDate) {
      const searchDate = new Date(filterDate);

      reports = reports.filter((report) => {
        let reportDate;
        if (
          report.createdAt &&
          typeof report.createdAt === "object" &&
          report.createdAt.toDate
        ) {
          reportDate = report.createdAt.toDate();
        } else if (typeof report.createdAt === "string") {
          reportDate = new Date(report.createdAt);
        } else {
          return false;
        }

        return (
          reportDate.toLocaleDateString() === searchDate.toLocaleDateString()
        );
      });
    }

    reports.sort((a, b) => {
      const dateA =
        a.createdAt && typeof a.createdAt === "object" && a.createdAt.toDate
          ? a.createdAt.toDate()
          : new Date(a.createdAt);
      const dateB =
        b.createdAt && typeof b.createdAt === "object" && b.createdAt.toDate
          ? b.createdAt.toDate()
          : new Date(b.createdAt);
      return dateB - dateA;
    });

    if (reports.length === 0) {
      reportsContainer.innerHTML = `
            <div class="position-absolute top-50 start-50 translate-middle align-items-center col-12 text-center py-4">
                <i class="bi bi-exclamation-circle fs-1 text-muted"></i>
                <h6 class="mt-2">No Assistant Reports Found</h6>
                <p class="mt-1">You currently don't have any assistant report.</p>
            </div>
        `;
      return;
    }

    for (const report of reports) {
      const reportCard = await createReportCard(report);
      reportsContainer.appendChild(reportCard);
    }
  } catch (error) {
    console.error("Error displaying assistant reports:", error);
    showError("Failed to load assistant reports. Please try again later.");
    throw error;
  } finally {
    showLoading(false);
  }
}

async function createReportCard(report) {
  const reportDate = new Date(report.createdAt);
  const formattedDate = reportDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const card = document.createElement("a");
  card.href = "#";
  card.className = "assistant-report-card mb-2";
  card.dataset.id = report.id;
  card.dataset.bsToggle = "modal";
  card.dataset.bsTarget = "#viewAssistantReportModal";

  let hasImages = false;
  try {
    const images = await firebaseCRUD.getAllData(`assistantreports/${report.id}/images`);
    hasImages = images.length > 0;
  } catch (error) {
    console.error("Error checking for images:", error);
  }

  card.innerHTML = `
    <span id="title" class="text-truncate" style="width: calc(100% - 10px);">${
      report.title || "Untitled Assistant Report"
    }</span>
    <span id="separator"></span>
    <div class="assistant-report-content-container">
        <p class="text-truncate m-0" style="width: calc(100% - 40px);">${
          report.content || "No content"
        }</p>
        <p id="date" class="mt-2 text-end">${formattedDate}</p>
    </div>
  `;

  card.addEventListener("click", async () => {
    await showReportDetails(report);
  });

  return card;
}

async function showReportDetails(report) {
  const reportDate = new Date(report.createdAt);
  const formattedDate = reportDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  reportTitleInput.value = report.title || "Untitled Assistant Report";
  reportContentTextarea.value = `${
    report.content || ""
  }\n\nSubmitted on: ${formattedDate}`;

  reportImagesContainer.innerHTML = "";

  try {
    const imageDocs = await firebaseCRUD.getAllData(
      `assistantreports/${report.id}/images`
    );

    if (imageDocs.length > 0) {
      imageDocs.forEach((imageDoc) => {
        if (imageDoc.imageData) {
          const imgWrapper = document.createElement("div");
          imgWrapper.className = "image-wrapper";
          imgWrapper.style.position = "relative";
          imgWrapper.style.display = "inline-block";
          imgWrapper.style.marginRight = "10px";

          const img = document.createElement("img");
          img.src = imageDoc.imageData;
          img.alt = "Assistant report image";
          img.style.maxWidth = "100px";
          img.style.maxHeight = "100px";
          img.style.cursor = "pointer";
          img.style.objectFit = "cover";
          img.style.borderRadius = "5px";

          img.addEventListener("click", () => {
            showImageInModal(imageDoc.imageData);
          });

          const zoomIcon = document.createElement("i");
          zoomIcon.className = "bi bi-zoom-in";
          zoomIcon.style.position = "absolute";
          zoomIcon.style.bottom = "5px";
          zoomIcon.style.right = "5px";
          zoomIcon.style.color = "white";
          zoomIcon.style.textShadow = "0 0 3px rgba(0,0,0,0.5)";
          zoomIcon.style.pointerEvents = "none";

          imgWrapper.appendChild(img);
          imgWrapper.appendChild(zoomIcon);
          reportImagesContainer.appendChild(imgWrapper);
        }
      });
    } else {
      const noImage = document.createElement("p");
      noImage.textContent = "No images attached";
      noImage.className = "text-white";
      reportImagesContainer.appendChild(noImage);
    }
  } catch (error) {
    console.error("Error loading images:", error);
    const errorMsg = document.createElement("p");
    errorMsg.textContent = "Error loading images";
    errorMsg.className = "text-white";
    reportImagesContainer.appendChild(errorMsg);
  }
}

function showImageInModal(imageSrc) {
  const modalImageView = document.getElementById("modal-image-view");
  const viewImageModal = new bootstrap.Modal(
    document.getElementById("viewImageModal")
  );

  modalImageView.src = imageSrc;
  viewImageModal.show();
}

function setupEventListeners() {
  const refreshBtn = document.getElementById("refresh-reports-btn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      reportSearchInput.value = "";
      displayReports();
    });
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

function showError(message) {
  const container = document.querySelector(".card-container");
  container.innerHTML = `
    <div class="col-12 text-center py-4">
        <i class="bi bi-exclamation-triangle-fill fs-1 text-danger"></i>
        <p class="mt-2">${message}</p>
        <button class="btn btn-primary mt-2" onclick="location.reload()">Retry</button>
    </div>
  `;
}

function setupDateSearch() {
  const dateInput = document.getElementById("assistant-report-search-input");
  if (dateInput) {
    dateInput.addEventListener("change", function (e) {
      filterReportsByDate(e.target.value);
    });
  }
}

async function filterReportsByDate(selectedDate) {
  try {
    showLoading(true);

    const userId = localStorage.getItem("userId");
    if (!userId) {
      throw new Error("User not authenticated");
    }

    reportsContainer.innerHTML = "";

    if (!selectedDate) {
      await displayReports();
      return;
    }

    let reports = await firebaseCRUD.queryData(
      "assistantreports",
      "userId",
      "==",
      userId
    );

    const searchDate = new Date(selectedDate);

    const filteredReports = reports.filter((report) => {
      let reportDate;
      if (
        report.createdAt &&
        typeof report.createdAt === "object" &&
        report.createdAt.toDate
      ) {
        reportDate = report.createdAt.toDate();
      } else if (typeof report.createdAt === "string") {
        reportDate = new Date(report.createdAt);
      } else {
        return false;
      }

      return (
        reportDate.getFullYear() === searchDate.getFullYear() &&
        reportDate.getMonth() === searchDate.getMonth() &&
        reportDate.getDate() === searchDate.getDate()
      );
    });

    if (filteredReports.length === 0) {
      reportsContainer.innerHTML = `
        <div class="position-absolute top-50 start-50 translate-middle align-items-center col-12 text-center py-4">
          <i class="bi bi-exclamation-circle fs-1 text-muted"></i>
          <h6 class="mt-2">No Assistant Reports Found For This Date</h6>
          <p class="mt-1">Please choose a different date or create a new assistant report.</p>
        </div>
      `;
      return;
    }

    filteredReports.sort((a, b) => {
      const dateA =
        a.createdAt && typeof a.createdAt === "object" && a.createdAt.toDate
          ? a.createdAt.toDate()
          : new Date(a.createdAt);
      const dateB =
        b.createdAt && typeof b.createdAt === "object" && b.createdAt.toDate
          ? b.createdAt.toDate()
          : new Date(b.createdAt);
      return dateB - dateA;
    });

    for (const report of filteredReports) {
      const reportCard = await createReportCard(report);
      reportsContainer.appendChild(reportCard);
    }
  } catch (error) {
    console.error("Error filtering assistant reports by date:", error);
    showError("Failed to filter assistant reports. Please try again later.");
  } finally {
    showLoading(false);
  }
}

export { displayReports, showReportDetails };