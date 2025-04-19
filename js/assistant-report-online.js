import { firebaseCRUD } from "./firebase-crud.js";

// DOM elements
const reportsContainer = document.querySelector(".card-container");
const reportSearchInput = document.getElementById(
  "assistant-report-search-input"
);
const viewReportModal = document.getElementById("viewAssistantReportModal");
const reportTitleInput = document.getElementById("assistant-report-title");
const reportContentTextarea = document.getElementById(
  "assistant-report-content"
);
const reportImagesContainer = document.querySelector(
  ".assistant-report-images .image-container"
);

// Initialize the page
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await displayReports();
    setupEventListeners();
  } catch (error) {
    console.error("Initialization error:", error);
    alert("Failed to load assistant reports. Please try again later.");
  }
});

// Display all assistant reports from Firebase
async function displayReports(filterDate = null) {
  try {
    reportsContainer.innerHTML = ""; // Clear existing content

    // Get the current user ID
    const userId = localStorage.getItem("userId");
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Query assistant reports for this user
    let reports = await firebaseCRUD.queryData(
      "assistantreports",
      "userId",
      "==",
      userId
    );

    if (filterDate) {
      // Convert filterDate to Date object for comparison
      const searchDate = new Date(filterDate);
      const searchDateStr = searchDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });

      reports = reports.filter((report) => {
        // Handle both Timestamp and string formats
        let reportDate;
        if (
          report.createdAt &&
          typeof report.createdAt === "object" &&
          report.createdAt.toDate
        ) {
          // Firebase Timestamp object
          reportDate = report.createdAt.toDate();
        } else if (typeof report.createdAt === "string") {
          // ISO string
          reportDate = new Date(report.createdAt);
        } else {
          // Unknown format, skip this report
          return false;
        }

        const reportDateStr = reportDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });

        return reportDateStr === searchDateStr;
      });
    }

    // Sort by date (newest first)
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
      reportsContainer.innerHTML =
        '<p class="text-center mt-3">No assistant reports found</p>';
      return;
    }

    // Create report cards
    for (const report of reports) {
      const reportCard = await createReportCard(report);
      reportsContainer.appendChild(reportCard);
    }
  } catch (error) {
    console.error("Error displaying assistant reports:", error);
    throw error;
  }
}
// Create an assistant report card element
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

  // Check if report has images
  let hasImages = false;
  try {
    const images = await firebaseCRUD.getAllData(
      `assistantreports/${report.id}/images`
    );
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

  // Add click event to show report details
  card.addEventListener("click", async () => {
    await showReportDetails(report);
  });

  return card;
}

// Show assistant report details in modal
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

  // Clear previous images
  reportImagesContainer.innerHTML = "";

  try {
    // Fetch all image documents from the subcollection
    const imageDocs = await firebaseCRUD.getAllData(
      `assistantreports/${report.id}/images`
    );

    if (imageDocs.length > 0) {
      imageDocs.forEach((imageDoc) => {
        // Access the imageData field from each document
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

          // Add click to view in modal functionality
          img.addEventListener("click", () => {
            showImageInModal(imageDoc.imageData);
          });

          // Optional: Add zoom icon overlay
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

// Function to show image in modal
function showImageInModal(imageSrc) {
  const modalImageView = document.getElementById("modal-image-view");
  const viewImageModal = new bootstrap.Modal(
    document.getElementById("viewImageModal")
  );

  modalImageView.src = imageSrc;
  viewImageModal.show();
}

// Setup event listeners
function setupEventListeners() {
  // Date filter
  if (reportSearchInput) {
    reportSearchInput.addEventListener("change", (e) => {
      const selectedDate = e.target.value;
      displayReports(selectedDate);
    });
  }

  // Function to show image in modal
}

// Export functions if needed
export { displayReports, showReportDetails };
