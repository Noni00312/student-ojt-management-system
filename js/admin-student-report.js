import { firebaseCRUD } from "./firebase-crud.js";

function showLoading(show) {
  const loader = document.getElementById("loading-indicator") || createLoader();
  if (loader) {
    loader.style.display = show ? "block" : "none";
  }
}

function createLoader() {
  try {
    const loader = document.createElement("div");
    loader.id = "loading-indicator";
    loader.className = "text-center py-4";
    loader.innerHTML =
      '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';

    const container =
      document.querySelector(".card-container") ||
      document.querySelector(".student-report-container") ||
      document.body;

    if (container) {
      container.prepend(loader);
      return loader;
    }
    return null;
  } catch (error) {
    console.error("Error creating loader:", error);
    return null;
  }
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

document.addEventListener("DOMContentLoaded", async function () {
  showLoading(true);
  try {
    const userId = getUserIdFromUrl() || localStorage.getItem("userId");
    console.log(userId);

    if (userId) {
      await Promise.all([
        loadStudentReports(userId),
        loadStudentData(userId),
        loadAttendanceData(userId),
      ]);

      const attendanceCalendar = initializeAttendanceCalendar();
      await attendanceCalendar.init(userId);

      try {
        const { firebaseCRUD } = await import("./firebase-crud.js");
        const students = await firebaseCRUD.queryData(
          "students",
          "userId",
          "==",
          userId
        );

        if (students?.[0]?.userType === "studentAssistant") {
          const btn = document.getElementById("appoint-assistant-btn");
          if (btn) {
            btn.textContent = "Assistant Appointed";
            btn.disabled = true;
          }
        }
      } catch (error) {
        console.error("Error checking assistant status:", error);
        Swal.fire({
          icon: "error",
          title: "Something Went Wrong",
          text: `Failed to check assistant status: ${error.message}`,
          confirmButtonColor: "#590f1c",
        });
      }
    } else {
      console.error("No user ID found");
      showError("No user ID found. Please return to the student list.");
    }
  } catch (error) {
    console.error("Initialization error:", error);
    showError("Failed to initialize: " + error.message);
  } finally {
    showLoading(false);
  }
});

async function loadStudentData(userId) {
  showLoading(true);
  try {
    const { firebaseCRUD } = await import("./firebase-crud.js");
    const students = await firebaseCRUD.queryData(
      "students",
      "userId",
      "==",
      userId
    );

    if (!students || students.length === 0) {
      console.log("No student data found");
      return;
    }

    const studentData = students[0];

    const companyNameEl = document.getElementById("company-name");
    const companyImageEl = document.querySelector(".company-container img");
    const userNameEl = document.getElementById("user-name");
    const phoneTextEl = document.getElementById("phone-number-text");
    const emailTextEl = document.getElementById("email-text");
    const phoneTooltip = document.querySelector(
      ".phone-email-container .tt:first-child"
    );
    const emailTooltip = document.querySelector(
      ".phone-email-container .tt:last-child"
    );

    const profileImgEl = document.getElementById("user-profile-img");
    if (profileImgEl) {
      if (studentData.userImg) {
        profileImgEl.src = studentData.userImg;
      } else {
        const defaultMaleImg = "../assets/img/icons8_male_user_480px_1.png";
        const defaultFemaleImg = "../assets/img/icons8_female_user_480px.png";

        if (studentData.gender === "Female") {
          profileImgEl.src = defaultFemaleImg;
        } else {
          profileImgEl.src = defaultMaleImg;
        }
      }
    }

    let fullName = studentData.firstName || "";
    if (studentData.middleName) fullName += " " + studentData.middleName;
    if (studentData.lastName) fullName += " " + studentData.lastName;
    if (studentData.suffix) fullName += " " + studentData.suffix;

    const truncatedName =
      fullName.length > 20 ? fullName.substring(0, 20) + "..." : fullName;

    if (companyNameEl)
      companyNameEl.textContent =
        studentData.companyName || "Department of Agrarian Reform";
    if (userNameEl) {
      userNameEl.textContent = truncatedName;
      userNameEl.setAttribute("title", fullName);
      userNameEl.classList.add("text-truncate");
    }

    const phoneNumber = studentData.phoneNumber || "N/A";
    if (phoneTextEl) phoneTextEl.textContent = phoneNumber;
    if (phoneTooltip) phoneTooltip.setAttribute("data-bs-title", phoneNumber);

    const emailAddress = studentData.emailAddress || "N/A";
    if (emailTextEl) emailTextEl.textContent = emailAddress;
    if (emailTooltip) emailTooltip.setAttribute("data-bs-title", emailAddress);

    const tooltipTriggerList = [].slice.call(
      document.querySelectorAll('[data-bs-toggle="tooltip"]')
    );
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    if (studentData.companyName) {
      await loadCompanyImage(studentData.companyName, companyImageEl);
    }
  } catch (error) {
    console.error("Error loading student data:", error);
    Swal.fire({
      icon: "error",
      title: "Something Went Wrong",
      text: `Failed to load student data: ${error.message}`,
      confirmButtonColor: "#590f1c",
    });
  } finally {
    showLoading(false);
  }
}
function initTooltip(element) {
  if (element._tooltip) {
    bootstrap.Tooltip.getInstance(element).dispose();
  }
  new bootstrap.Tooltip(element, {
    trigger: "hover focus",
  });
}

async function loadCompanyImage(companyName) {
  try {
    const imageElement = document.getElementById("image");
    if (!imageElement) {
      console.error("Image element not found");
      return;
    }

    const { firebaseCRUD } = await import("./firebase-crud.js");
    const companies = await firebaseCRUD.queryData(
      "company",
      "companyName",
      "==",
      companyName
    );

    if (companies && companies.length > 0 && companies[0].image) {
      const base64Image = companies[0].image;
      if (
        base64Image.endsWith("==") ||
        base64Image.endsWith("=") ||
        base64Image.length % 4 === 0
      ) {
        imageElement.src = base64Image;
        imageElement.alt = `${companyName} logo`;
      } else {
        console.error("Incomplete Base64 string");
        setDefaultImage(imageElement);
      }
    } else {
      console.log("No company image found, using default");
      setDefaultImage(imageElement);
    }
  } catch (error) {
    console.error("Error loading company image:", error);
    setDefaultImage(document.getElementById("image"));
  }
}

function setDefaultImage(imgElement) {
  if (imgElement) {
    imgElement.src = "../assets/img/OC.jpg";
    imgElement.alt = "Default company background image";
  }
}

async function loadAttendanceData(userId) {
  showLoading(true);
  try {
    const { firebaseCRUD } = await import("./firebase-crud.js");
    const attendanceRecords = await firebaseCRUD.queryData(
      "completeAttendanceTbl",
      "userId",
      "==",
      userId
    );

    if (!attendanceRecords || attendanceRecords.length === 0) {
      console.log("No attendance records found");
      return;
    }

    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    let totalHours = 0;
    let totalMinutes = 0;

    attendanceRecords.forEach((record) => {
      const isPresent = String(record.isPresent).toLowerCase() === "true";
      const isLate = String(record.isLate).toLowerCase() === "true";

      if (isPresent) {
        presentCount++;
        if (isLate) {
          lateCount++;
        }
      } else {
        absentCount++;
      }

      totalHours += parseInt(record.workHours) || 0;
      totalMinutes += parseInt(record.totalMinutes) || 0;
    });

    totalHours += Math.floor(totalMinutes / 60);
    totalMinutes = totalMinutes % 60;

    const accumulatedTime = `${totalHours
      .toString()
      .padStart(2, "0")}:${totalMinutes.toString().padStart(2, "0")}:00`;

    updateAttendanceDisplay(
      presentCount,
      lateCount,
      absentCount,
      accumulatedTime
    );
  } catch (error) {
    console.error("Error loading attendance data:", error);
    Swal.fire({
      icon: "error",
      title: "Something Went Wrong",
      text: `Failed to load attendance data: ${error.message}`,
      confirmButtonColor: "#590f1c",
    });
  } finally {
    showLoading(false);
  }
}

function updateAttendanceDisplay(present, late, absent, accumulatedTime) {
  const presentElement = document.querySelector(
    ".attendance-status-container p:nth-child(1) .number"
  );
  const lateElement = document.querySelector(
    ".attendance-status-container p:nth-child(2) .number"
  );
  const absentElement = document.querySelector(
    ".attendance-status-container p:nth-child(3) .number"
  );
  const timeElement = document.querySelector(".time-life-container span");

  if (presentElement) presentElement.textContent = present;
  if (lateElement) lateElement.textContent = late;
  if (absentElement) absentElement.textContent = absent;
  if (timeElement) timeElement.textContent = accumulatedTime;
}

document
  .getElementById("appoint-assistant-btn")
  ?.addEventListener("click", async function () {
    showLoading(true);
    try {
      const userId = getUserIdFromUrl() || localStorage.getItem("userId");
      if (!userId) throw new Error("No user ID found");

      const { firebaseCRUD } = await import("./firebase-crud.js");

      const students = await firebaseCRUD.queryData(
        "students",
        "userId",
        "==",
        userId
      );
      if (!students || students.length === 0)
        throw new Error("Student not found");

      const studentDocId = students[0].id;

      await firebaseCRUD.updateData("students", studentDocId, {
        userType: "studentAssistant",
      });

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Student appointed as assistant successfully!",
        timer: 2000,
        showConfirmButton: false,
      });
      this.textContent = "Assistant Appointed";
      this.disabled = true;
    } catch (error) {
      console.error("Error appointing assistant:", error);
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: `Failed to appoint assistant: ${error.message}`,
        confirmButtonColor: "#590f1c",
      });
    } finally {
      showLoading(false);
    }
  });

function getUserIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("userId");
}

async function loadStudentReports(userId) {
  showLoading(true);
  try {
    const { firebaseCRUD } = await import("./firebase-crud.js");

    const students = await firebaseCRUD.queryData(
      "students",
      "userId",
      "==",
      userId
    );
    if (!students || students.length === 0)
      throw new Error("Student not found");

    const student = students[0];
    displayStudentInfo(student);

    const reports = await firebaseCRUD.queryData(
      "reports",
      "userId",
      "==",
      userId
    );
    reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (reports && reports.length > 0) {
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      const todaysReports = reports.filter((report) => {
        const reportDate = new Date(report.createdAt);
        reportDate.setHours(0, 0, 0, 0);
        return reportDate.getTime() === currentDate.getTime();
      });

      if (todaysReports.length > 0) {
        displayReports(todaysReports);
      } else {
        displayNoReportsMessage("No reports found for today");
      }

      setupDateNavigation(reports);
    } else {
      displayNoReportsMessage("No reports found for this student");
    }
  } catch (error) {
    console.error("Error loading reports:", error);
    showError("Failed to load reports: " + error.message);
  } finally {
    showLoading(false);
  }
}

function displayStudentInfo(student) {
  const studentNameElement = document.querySelector(".student-name");
  if (studentNameElement) {
    const fullName = `${student.firstName} ${student.middleName || ""} ${
      student.lastName
    } ${student.suffix || ""}`.trim();
    const truncatedName =
      fullName.length > 25 ? fullName.substring(0, 25) + "..." : fullName;
    studentNameElement.textContent = truncatedName;
    studentNameElement.title = fullName;
    globalStudentName = fullName;
  }
}

function formatDateTime(dateString) {
  const date = new Date(dateString);

  const timeOptions = {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  };
  const formattedTime = date.toLocaleTimeString("en-US", timeOptions);

  const dateOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const formattedDate = date.toLocaleDateString("en-US", dateOptions);

  return {
    time: formattedTime,
    date: formattedDate,
    monthName: date.toLocaleString("default", { month: "long" }),
    monthDay: date.getDate(),
    fullDate: dateString,
  };
}
let globalStudentName = "";
async function displayReports(reports) {
  const reportsContainer = document.querySelector(".student-report-container");
  reportsContainer.innerHTML = "";

  for (const report of reports) {
    const formattedDateTime = formatDateTime(report.createdAt);

    // Load base64 images
    const images = await loadReportImages(report.id);

    const reportElement = document.createElement("div");
    reportElement.className = "report p-3 mb-4 rounded";

    reportElement.innerHTML = `
      <p class="text-end text-light">
        <small class="font-darker-light-color">${formattedDateTime.time}</small>
      </p>
      <h2 class="border-bottom border-light text-truncate pb-2 fw-bold font-darker-light-color">
        ${report.title || "Daily Report"}
      </h2>
      ${
        images.length > 0
          ? `
        <div class="image-container mb-2 d-flex flex-row flex-nowrap gap-2 overflow-auto">
          ${images
            .map(
              (base64Img) => `
            <img src="${base64Img}" alt="Report image"
              class="clickable-report-image"
              style="max-width: 100px; max-height: 100px; object-fit: cover; border-radius: 8px; cursor: pointer;">
          `
            )
            .join("")}
        </div>`
          : ""
      }
      <div class="content-container mt-2">
        <p class="text-light fs-6 fw-normal mb-0">
          ${report.content || "No content provided"}
        </p>
      </div>
      <div class="w-100 d-flex justify-content-end" style="max-height: 54px">
        <button class="col-12 col-lg-auto d-flex justify-content-center" id="download-report-button-${
          report.id
        }">
          <i class="bi bi-download fs-4"></i>
        </button>
      </div>
    `;

    reportsContainer.appendChild(reportElement);

    const imageElements = reportElement.querySelectorAll(
      ".clickable-report-image"
    );
    imageElements.forEach((img) => {
      img.addEventListener("click", () => {
        document.getElementById("modal-image-view").src = img.src;
        const viewImageModal = new bootstrap.Modal(
          document.getElementById("viewImageModal")
        );
        viewImageModal.show();
      });
    });

    const downloadButton = document.getElementById(
      `download-report-button-${report.id}`
    );

    document
      .getElementById(`download-report-button-${report.id}`)
      .addEventListener("click", async () => {
        const button = document.getElementById(
          `download-report-button-${report.id}`
        );

        const originalIcon = button.innerHTML;

        button.innerHTML = `
          <div class="spinner-border spinner-border-sm text-light" role="status" style="width: 1.2rem; height: 1.2rem;">
            <span class="visually-hidden">Loading...</span>
          </div>
        `;
        button.disabled = true;

        try {
          const reportData = {
            title: report.title || "Daily Report",
            date: new Date(report.createdAt).toLocaleDateString(),
            content: report.content || "No content",
            images: images,
            studentName: globalStudentName || "Student",
            logoBase64: await fetchBase64("../assets/img/oc.png"),
          };

          const pdfGen = new PDFReportGenerator();
          await pdfGen.generate(reportData);

          alert("PDF exported successfully!");
        } catch (err) {
          console.error("Failed to generate PDF:", err);
          alert("Failed to generate PDF.");
        } finally {
          button.innerHTML = originalIcon;
          button.disabled = false;
          button.style.backgroundColor = "rgb(110, 20, 35)";
        }
      });
  }
}

async function fetchBase64(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

async function loadReportImages(reportId) {
  try {
    const imageDocs = await firebaseCRUD.getAllData(
      `reports/${reportId}/images`
    );

    const images = [];
    imageDocs.forEach((doc) => {
      if (doc.imageData) {
        images.push(doc.imageData);
      }
    });

    return images;
  } catch (error) {
    console.error(`Failed to load images for report ${reportId}:`, error);
    return [];
  }
}

function setupDateNavigation(reports) {
  const dateContainer = document.querySelector(".date-container");
  dateContainer.innerHTML = "";

  const uniqueDates = [
    ...new Set(
      reports.map((report) => {
        const date = new Date(report.createdAt);
        return new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        ).toISOString();
      })
    ),
  ];

  uniqueDates.forEach((dateString) => {
    const date = new Date(dateString);
    const formattedDate = formatDateTime(dateString);
    const reportsForDate = reports.filter((report) => {
      const reportDate = new Date(report.createdAt);
      return (
        reportDate.getFullYear() === date.getFullYear() &&
        reportDate.getMonth() === date.getMonth() &&
        reportDate.getDate() === date.getDate()
      );
    });

    const dateButton = document.createElement("button");
    dateButton.className =
      "w-100 border-0 px-0 py-2 bg-transparent d-flex align-items-center justify-content-between border-bottom border-light rounded-0";
    dateButton.innerHTML = `
      <span class="report-date-sm mt-1 d-flex flex-column align-items-center justify-content-between d-md-none text-center w-100">
        <span id="month-name-sm" class="fw-normal text-truncate" style="font-size: 12px; width: calc(100% - 5px)">
          ${formattedDate.monthName}
        </span>
        <span id="month-date-sm" class="fs-3 fw-bold">${formattedDate.monthDay}</span>
      </span>
      <span class="d-none d-md-block d-flex text-center w-100 fw-normal">${formattedDate.date}</span>
    `;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date.getTime() === today.getTime()) {
      dateButton.classList.add("active-date");
    }

    dateButton.addEventListener("click", () => {
      document.querySelectorAll(".date-container button").forEach((btn) => {
        btn.classList.remove("active-date");
      });
      dateButton.classList.add("active-date");

      filterReportsByDate(date, reports);
    });

    dateContainer.appendChild(dateButton);
  });
}

function filterReportsByDate(selectedDate, allReports) {
  const filteredReports = allReports.filter((report) => {
    const reportDate = new Date(report.createdAt);
    return (
      reportDate.getFullYear() === selectedDate.getFullYear() &&
      reportDate.getMonth() === selectedDate.getMonth() &&
      reportDate.getDate() === selectedDate.getDate()
    );
  });

  displayReports(filteredReports);
}

function displayNoReportsMessage(
  message = "No reports found for this student"
) {
  const reportsContainer = document.querySelector(".student-report-container");
  reportsContainer.innerHTML = `
    <div class="text-center text-light py-5">
      <i class="bi bi-file-earmark-text fs-1"></i>
      <p class="mt-3">${message}</p>
    </div>
  `;
}

document
  .querySelector('[data-bs-target="#editDataModal"]')
  ?.addEventListener("click", async function () {
    showLoading(true);
    try {
      const userId = getUserIdFromUrl() || localStorage.getItem("userId");
      if (!userId) throw new Error("No user ID found");

      const { firebaseCRUD } = await import("./firebase-crud.js");

      await initializeDropdowns();

      await loadAndSetStudentData(userId);
    } catch (error) {
      console.error("Error loading student data:", error);
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: `Failed to load student data: ${error.message}`,
        confirmButtonColor: "#590f1c",
      });
    } finally {
      showLoading(false);
    }
  });

async function initializeDropdowns() {
  const genderSelect = document.getElementById("gender");
  genderSelect.innerHTML = `
    <option value="Male">Male</option>
    <option value="Female">Female</option>
  `;

  const companySelect = document.getElementById("companyName");
  companySelect.innerHTML = '<option value="">Select a company</option>';

  try {
    const companies = await firebaseCRUD.getAllData("company");

    if (companies) {
      const companiesArray = Array.isArray(companies)
        ? companies
        : Object.values(companies);

      if (companiesArray?.length) {
        companiesArray.forEach((company) => {
          if (company?.companyName) {
            const option = document.createElement("option");
            option.value = company.companyName;
            option.textContent = company.companyName;
            companySelect.appendChild(option);
          }
        });
      }
    }
  } catch (error) {
    console.warn("Could not load company list:", error);
    ["DAR", "DOST"].forEach((company) => {
      const option = document.createElement("option");
      option.value = company;
      option.textContent = company;
      companySelect.appendChild(option);
    });
  }
}
async function loadAndSetStudentData(userId) {
  try {
    const { firebaseCRUD } = await import("./firebase-crud.js");
    const students = await firebaseCRUD.queryData(
      "students",
      "userId",
      "==",
      userId
    );
    if (!students || students.length === 0)
      throw new Error("Student not found");

    const student = students[0];

    document.getElementById("user-id").value = userId;
    document.getElementById("student-id").value = student.studentId || "";
    document.getElementById("phone-number").value = student.phoneNumber || "";
    document.getElementById("first-name").value = student.firstName || "";
    document.getElementById("middle-name").value = student.middleName || "";
    document.getElementById("last-name").value = student.lastName || "";
    document.getElementById("sufix").value = student.suffix || "";
    document.getElementById("address").value = student.address || "";

    if (student.gender) {
      document.getElementById("gender").value = student.gender;
    }

    if (student.companyName) {
      document.getElementById("companyName").value = student.companyName;
    }

    document.getElementById("morning-time-in").value =
      student.morningTimeIn || "";
    document.getElementById("morning-time-out").value =
      student.morningTimeOut || "";
    document.getElementById("afternoon-time-in").value =
      student.afternoonTimeIn || "";
    document.getElementById("afternoon-time-out").value =
      student.afternoonTimeOut || "";

    document.getElementById("user-type").value = student.userType || "student";

    if (student.userImg) {
      document.getElementById("user-profile-img").src = student.userImg;
    }

    if (student.weeklySchedule) {
      const days = ["MON", "TUE", "WED", "THURS", "FRI", "SAT", "SUN"];
      days.forEach((day) => {
        const checkbox = document.querySelector(
          `input[name="weeklySchedule[]"][value="${day}"]`
        );
        if (checkbox) {
          checkbox.checked = !!student.weeklySchedule[day];
        }
      });
    }
  } catch (error) {
    throw error;
  }
}

document
  .getElementById("edit-info-form")
  ?.addEventListener("submit", async function (e) {
    e.preventDefault();
    showLoading(true);
    try {
      const userId = getUserIdFromUrl() || localStorage.getItem("userId");
      if (!userId) throw new Error("No user ID found");

      const { firebaseCRUD } = await import("./firebase-crud.js");
      const checkedDays = Array.from(
        document.querySelectorAll('input[name="weeklySchedule[]"]:checked')
      ).map((checkbox) => checkbox.value);

      const weeklySchedule = {
        MON: checkedDays.includes("MON"),
        TUES: checkedDays.includes("TUES"),
        WED: checkedDays.includes("WED"),
        THURS: checkedDays.includes("THURS"),
        FRI: checkedDays.includes("FRI"),
        SAT: checkedDays.includes("SAT"),
        SUN: checkedDays.includes("SUN"),
      };

      const formData = {
        studentId: document.getElementById("student-id").value,
        phoneNumber: document.getElementById("phone-number").value,
        firstName: document.getElementById("first-name").value,
        middleName: document.getElementById("middle-name").value,
        lastName: document.getElementById("last-name").value,
        suffix: document.getElementById("sufix").value,
        gender: document.getElementById("gender").value,
        address: document.getElementById("address").value,
        companyName: document.getElementById("companyName").value,
        morningTimeIn: document.getElementById("morning-time-in").value,
        morningTimeOut: document.getElementById("morning-time-out").value,
        afternoonTimeIn: document.getElementById("afternoon-time-in").value,
        afternoonTimeOut: document.getElementById("afternoon-time-out").value,
        userType: document.getElementById("user-type").value,
        updatedAt: new Date().toISOString(),
      };

      const students = await firebaseCRUD.queryData(
        "students",
        "userId",
        "==",
        userId
      );
      if (!students || students.length === 0)
        throw new Error("Student not found");

      const studentDocId = students[0].id;

      await firebaseCRUD.updateData("students", studentDocId, formData);

      Swal.fire({
        icon: "success",
        title: "Update Success",
        text: "Student information updated successfully!",
        timer: 2000,
        showConfirmButton: false,
      });

      const editModal = bootstrap.Modal.getInstance(
        document.getElementById("editDataModal")
      );
      editModal.hide();

      displayStudentInfo({ ...students[0], ...formData });
    } catch (error) {
      console.error("Error updating student:", error);

      Swal.fire({
        icon: "error",
        title: "Someting Went Wrong",
        text: `Failed to update student: ${error.message}`,
        confirmButtonColor: "#590f1c",
      });
    } finally {
      showLoading(false);
    }
  });

function initializeAttendanceCalendar() {
  let currentDate = new Date();
  let attendanceData = {};
  const monthYearElement = document.getElementById("month-year");
  const daysElement = document.getElementById("days");
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");

  async function fetchAttendanceData(userId) {
    showLoading(true);
    try {
      const { firebaseCRUD } = await import("./firebase-crud.js");
      const records = await firebaseCRUD.queryData(
        "completeAttendanceTbl",
        "userId",
        "==",
        userId
      );

      records.forEach((record) => {
        if (record.date) {
          attendanceData[record.date] = {
            isPresent: String(record.isPresent).toLowerCase() === "true",
            isLate: String(record.isLate).toLowerCase() === "true",
          };
        }
      });
    } catch (error) {
      console.error("Error fetching attendance data:", error);

      Swal.fire({
        icon: "error",
        title: "Something Went Wrong",
        text: `Failed to load attendance data: ${error.message}`,
        confirmButtonColor: "#590f1c",
      });
    } finally {
      showLoading(false);
    }
  }

  async function renderCalendar() {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    monthYearElement.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInLastMonth = new Date(currentYear, currentMonth, 0).getDate();

    daysElement.innerHTML = "";

    for (let i = firstDay - 1; i >= 0; i--) {
      const dayElement = document.createElement("div");
      dayElement.classList.add("day", "other-month");
      dayElement.textContent = daysInLastMonth - i;
      daysElement.appendChild(dayElement);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dayElement = document.createElement("div");
      dayElement.classList.add("day");
      dayElement.textContent = i;

      const formattedDate = `${currentYear}-${(currentMonth + 1)
        .toString()
        .padStart(2, "0")}-${i.toString().padStart(2, "0")}`;

      if (attendanceData[formattedDate]) {
        const record = attendanceData[formattedDate];

        if (record.isPresent && !record.isLate) {
          dayElement.classList.add("green");
        } else if (record.isPresent && record.isLate) {
          dayElement.classList.add("yellow");
        } else if (!record.isPresent) {
          dayElement.classList.add("red");
        }
      }

      daysElement.appendChild(dayElement);
    }

    const totalCells = firstDay + daysInMonth;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);

    for (let i = 1; i <= remainingCells; i++) {
      const dayElement = document.createElement("div");
      dayElement.classList.add("day", "other-month");
      dayElement.textContent = i;
      daysElement.appendChild(dayElement);
    }
  }

  prevBtn.addEventListener("click", function () {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });

  nextBtn.addEventListener("click", function () {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });

  return {
    init: async function (userId) {
      if (userId) {
        await fetchAttendanceData(userId);
      }
      renderCalendar();
    },
  };
}

function editProfileImg() {
  const fileInput = document.getElementById("user-img-profile");
  fileInput.click();

  fileInput.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (event) {
        const imgElement = document.getElementById("user-profile-img");
        imgElement.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  });
}
