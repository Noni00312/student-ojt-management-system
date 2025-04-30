import { firebaseCRUD } from "./firebase-crud.js";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const date = urlParams.get("date");

    if (!date) {
      throw new Error("No date specified in URL");
    }

    const formattedDate = formatDateForDisplay(date);
    document.querySelector("h1").textContent = formattedDate;

    showLoading(true);
    const studentsWithReports = await getStudentsWithIncidentReportsByDate(
      date
    );
    populateStudentCards(studentsWithReports);

    document.getElementById("studentSearch").addEventListener("input", (e) => {
      filterStudents(e.target.value.toLowerCase(), studentsWithReports);
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

function formatDateForDisplay(dateStr) {
  const date = new Date(dateStr);
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString("en-US", options).toUpperCase();
}

async function getStudentsWithIncidentReportsByDate(date) {
  try {
    // Get all incident reports for the selected date
    const reports = await firebaseCRUD.queryData(
      "incidentreports",
      "date",
      "==",
      date
    );

    if (!reports || reports.length === 0) {
      return [];
    }

    // Get student info for each report from Firebase students collection
    const studentsWithReports = await Promise.all(
      reports.map(async (report) => {
        // Query Firebase students collection using the userId from the report
        const studentData = await firebaseCRUD.queryData(
          "students",
          "userId",
          "==",
          report.userId
        );
        const student = studentData?.[0] || {};

        // Combine name components
        const fullName = formatStudentName(
          student?.firstName,
          student?.middleName,
          student?.lastName
        );

        return {
          userImg:
            student?.userImg || "../assets/img/icons8_male_user_480px_1.png",
          studentName: fullName || "Unknown Student",
          studentId: student?.studentId || "N/A",
          companyName: student?.companyName || "Unknown Company",
          reportId: report.id,
          reason: report.reason,
          createdAt: report.createdAt,
          reportDetails: report.report,
        };
      })
    );

    return studentsWithReports;
  } catch (error) {
    console.error("Error fetching students with incident reports:", error);
    throw error;
  }
}

function formatStudentName(firstName, middleName, lastName) {
  const nameParts = [firstName, middleName, lastName].filter(
    (part) => part && part.trim()
  );
  return nameParts.join(" ") || "Unknown Student";
}

function populateStudentCards(students) {
  const container = document.querySelector(".card-container .row");
  container.innerHTML = "";

  if (students.length === 0) {
    container.innerHTML = `
      <div class="position-absolute top-50 start-50 translate-middle col-12 text-center py-4">
        <i class="bi bi-exclamation-circle fs-1 text-muted"></i>
        <h6 class="mt-2 text-secondary">No Student Found</h6>
        <p class="mt-1 text-muted">Oops! No matching results found. Try searching with a different keyword.</p>
      </div>
    `;
    return;
  }

  students.forEach((student) => {
    const col = document.createElement("div");
    col.className = "col-lg-4 col-md-6 px-2 mb-3";

    const card = document.createElement("div");
    card.className = "student-card h-100 p-3";

    card.innerHTML = `
      <div class="d-flex align-items-center text-decoration-none h-100">
        <div class="img-container me-3 flex-shrink-0">
          <img src="${student.userImg}" alt="${student.studentName}" class="rounded-circle" >
        </div>
        <div class="main-container w-100 overflow-hidden">
          <div class="name-id-container d-flex justify-content-between">
            <p class="m-0 text-truncate fw-bold">${student.studentName}</p>
            <p class="m-0 ms-2 text-nowrap">${student.studentId}</p>
          </div>
          <div class="separator my-2"></div>
          <div>
            <p class="m-0 text-truncate small text-light">${student.companyName}</p>
          </div>
        </div>
      </div>
    `;

    // Show the modal and populate it with report data on click
    card.addEventListener("click", (e) => {
      e.preventDefault();
      populateReportModal(student);
      const modal = new bootstrap.Modal(
        document.getElementById("viewReportModal")
      );
      modal.show();
    });

    container.appendChild(col);
    col.appendChild(card);
  });
}
function populateReportModal(report) {
  // Set student info
  document.getElementById("modal-student-img").src = report.userImg;
  document.getElementById("modal-student-name").textContent =
    report.studentName;
  document.getElementById("modal-student-id").textContent = report.studentId;

  // Set report info
  document.getElementById("report-title").value =
    report.reason || "No title provided";
  document.getElementById("report-content").value =
    report.reportDetails || "No details provided";

  // Set status badge
  const statusBadge = document.getElementById("modal-report-status");
  statusBadge.textContent = report.reason || "Unknown";
  statusBadge.setAttribute("data-status", report.reason || "Unknown");

  // Format dates
  const reportDate = new Date(report.createdAt);
  const lastUpdated = new Date(report.lastUpdated);

  document.getElementById("modal-report-date").textContent =
    reportDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  document.getElementById(
    "modal-report-time"
  ).textContent = `Reported at: ${reportDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
  document.getElementById(
    "modal-last-updated"
  ).textContent = `Last updated: ${lastUpdated.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function filterStudents(searchTerm, allStudents) {
  const container = document.querySelector(".card-container .row");
  if (!searchTerm) {
    populateStudentCards(allStudents);
    return;
  }

  const filtered = allStudents.filter(
    (student) =>
      student.studentName.toLowerCase().includes(searchTerm) ||
      student.studentId.toLowerCase().includes(searchTerm) ||
      student.companyName.toLowerCase().includes(searchTerm)
  );

  populateStudentCards(filtered);
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
