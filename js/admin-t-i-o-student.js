import { firebaseCRUD } from "./firebase-crud.js";
import { getDoc, doc } from "./firebase-config.js";
import { db } from "./firebase-config.js";

let allStudentData = [];

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

document.getElementById("search-input").addEventListener("input", (event) => {
  const searchValue = event.target.value.toLowerCase();

  const filteredStudents = allStudentData.filter((student) =>
    formatName(student).toLowerCase().includes(searchValue)
  );

  renderStudentCards(filteredStudents);
});
let { date, companyName } = getUrlParams();

window.document.addEventListener("DOMContentLoaded", async () => {
  showLoading(true);
  try {
    await initializeUserImage();
    const { date, companyName } = getUrlParams();
    await loadDepartmentHeader(companyName);
    const companyData = await getCompanyData(companyName);
    const students = await loadStudent(`${companyName}_${date}`);
    const finalResult = await buildStudentAttendanceData(
      students,
      date,
      companyData
    );
    renderStudentCards(finalResult);

    allStudentData = finalResult;

    document.getElementById(
      "back-button"
    ).href = `./admin-t-i-o-company.html?date=${date}`;

    document.getElementById("search-input").addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase();

      const filtered = allStudentData.filter((student) =>
        formatName(student).toLowerCase().includes(query)
      );

      renderStudentCards(filtered);
    });
  } catch (err) {
    console.error("Failed to load student data:", err);
    showError("Something went wrong while loading attendance data.");
  } finally {
    showLoading(false);
  }
});

async function initializeUserImage() {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    console.error("No userId found in localStorage");
    return;
  }

  await window.dbReady;
  const dataArray = await crudOperations.getByIndex(
    "studentInfoTbl",
    "userId",
    userId
  );
  const data = Array.isArray(dataArray) ? dataArray[0] : dataArray;

  const img = document.getElementById("user-img");
  img.src = data?.userImg || "../assets/img/icons8_male_user_480px_1";
}

function getUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    date: urlParams.get("date"),
    companyName: urlParams.get("company-name"),
  };
}

async function loadDepartmentHeader(companyName) {
  const departmentName = document.getElementById("department-name");
  departmentName.textContent = companyName.toUpperCase();
}

async function buildStudentAttendanceData(students, date, companyData) {
  return await Promise.all(
    students.map(async (student) => {
      const attendance = await getStudentAttendanceRecord(student.userId, date);
      const hasIncident = await checkHasIncidentReport(student.userId, date);

      return {
        userId: student.userId,
        isPresent: attendance?.isPresent ?? false,
        isLate: attendance?.isLate ?? false,
        date: attendance?.date ?? date,
        firstName: student.firstName ?? "",
        middleName: student.middleName ?? "",
        lastName: student.lastName ?? "",
        suffix: student.suffix ?? "",
        image: student.image ?? "",
        hasIncidentReport: hasIncident,
        companyImage: companyData?.image ?? "",
      };
    })
  );
}

function renderStudentCards(studentsData) {
  const cardContainer = document.querySelector(".card-container");
  cardContainer.innerHTML = "";

  if (studentsData.length === 0) {
    cardContainer.innerHTML = `<div class="position-absolute top-50 start-50 translate-middle align-items-center col-12 text-center py-4">
                <i class="bi bi-exclamation-circle fs-1 text-muted"></i>
                <h6 class="mt-2">No Student Found For This Company</h6>
                <p class="mt-1">Oops! No matching results found. Try searching with a different keyword.</p>
            </div>`;
    return;
  }

  studentsData.forEach((student) => {
    const studentCard = document.createElement("div");
    studentCard.classList.add("col-lg-4", "col-md-6");
    studentCard.setAttribute("data-bs-toggle", "modal");
    studentCard.setAttribute("data-bs-target", "#viewAttendanceModal");
    studentCard.setAttribute("data-student-id", student.userId);
    studentCard.setAttribute("data-date", student.date);
    studentCard.setAttribute("data-has-incident", student.hasIncidentReport);
    studentCard.setAttribute("data-name", formatName(student));

    studentCard.innerHTML = `
      <div class="mb-3 curved-border-container">
        <div class="overlay" style="background: url('${
          student.companyImage || "../assets/img/OC.jpg"
        }') no-repeat center center/cover;">
          <div class="overlay-dark"></div>
        </div>
        <div class="content d-flex justify-content-start align-items-center p-2">
          <img
            id="user_profile"
            src="${
              student.image || "../assets/img/icons8_male_user_480px_1.png"
            }"
            alt="student-profile"
            class="img-fluid rounded-circle me-3"
          />
          <div class="text-container">
            <h6 class="mb-2">${formatName(student)}</h6>
            <p id="attendance-status" class="${
              student.isPresent
                ? student.isLate
                  ? "bg-warning"
                  : "bg-success"
                : "bg-danger"
            } w-100 m-0 text-white">
              ${
                student.isPresent
                  ? student.isLate
                    ? "Late"
                    : "Present"
                  : "Absent"
              }
            </p>
          </div>
        </div>
      </div>
    `;

    studentCard.addEventListener("click", () => {
      const userId = studentCard.getAttribute("data-student-id");
      const date = studentCard.getAttribute("data-date");
      const hasIncident = studentCard.getAttribute("data-has-incident");

      populateAttendanceModal(userId, date, hasIncident);
    });

    cardContainer.appendChild(studentCard);
  });
}

async function populateAttendanceModal(userId, date, hasIncident) {
  const logData = await getAttendanceByDate(userId, date);

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

  const incidentLink = document.getElementById("has-incident-report");
  if (hasIncident === "true") {
    incidentLink.classList.remove("d-none");
    incidentLink.href = `../pages/admin-incident-report-student.html?userId=${userId}&date=${date}`;
  } else {
    incidentLink.classList.add("d-none");
  }
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
      morningTimeIn: morningIn,
      morningTimeOut: morningOut,
      afternoonTimeIn: afternoonIn,
      afternoonTimeOut: afternoonOut,
    };
  } catch (error) {
    console.error("Error fetching logs by date:", error);
    return null;
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

async function getCompanyData(companyName) {
  try {
    const snapshot = await firebaseCRUD.queryData(
      "company",
      "companyName",
      "==",
      companyName
    );

    if (snapshot && snapshot.length > 0) {
      return snapshot[0];
    }
    return null;
  } catch (error) {
    console.error("Error fetching company data:", error);
    return null;
  }
}

function formatName(student) {
  let fullName = `${student.firstName} ${
    student.middleName ? student.middleName.charAt(0) + ". " : ""
  }${student.lastName}`;

  if (student.suffix) {
    fullName += ` ${student.suffix}`;
  }

  return fullName.trim();
}

async function loadStudent(companyUserIdData) {
  const userIds = await crudOperations
    .getData("companyUsersTbl", companyUserIdData)
    .then((record) => record?.users || [])
    .catch((err) => {
      console.error("Error fetching record:", err);
      return [];
    });

  const userDataNested = await Promise.all(
    userIds.map((userId) =>
      firebaseCRUD.queryData("students", "userId", "==", userId)
    )
  );

  const userData = userDataNested.flat().map((user) => ({
    userId: user.userId,
    firstName: user.firstName,
    middleName: user.middleName,
    lastName: user.lastName,
    suffix: user.suffix,
    image: user.userImg || "",
  }));

  return userData;
}

async function getStudentAttendanceRecord(studentId, date) {
  const records = await firebaseCRUD.queryData(
    "completeAttendanceTbl",
    "userId",
    "==",
    studentId
  );

  if (!records || records.length === 0) return null;

  const inputDate = new Date(date).toISOString().split("T")[0];

  const attendanceRecord = records.find((record) => {
    if (!record.date) return false;
    const recordDate =
      typeof record.date === "string"
        ? new Date(record.date).toISOString().split("T")[0]
        : record.date.toDate().toISOString().split("T")[0];

    return recordDate === inputDate;
  });

  if (!attendanceRecord) return null;

  return {
    isPresent: attendanceRecord.isPresent ?? false,
    isLate: attendanceRecord.isLate ?? false,
    date: attendanceRecord.date,
  };
}

async function checkHasIncidentReport(studentId, date) {
  const records = await firebaseCRUD.queryData(
    "incidentreports",
    "userId",
    "==",
    studentId
  );

  if (!records || records.length === 0) return false;

  const inputDate = new Date(date).toISOString().split("T")[0];

  const incidentRecord = records.find((record) => {
    if (!record.date) return false;
    const recordDate =
      typeof record.date === "string"
        ? new Date(record.date).toISOString().split("T")[0]
        : record.date.toDate().toISOString().split("T")[0];

    return recordDate === inputDate;
  });

  return !!incidentRecord;
}
