import { firebaseCRUD } from "./firebase-crud.js";

window.document.addEventListener("DOMContentLoaded", async () => {
  await window.dbReady;
  const urlParams = new URLSearchParams(window.location.search);
  const date = urlParams.get("date");
  const companyName = urlParams.get("company-name");
  const departmentName = document.getElementById("department-name");

  departmentName.textContent = companyName;

  const companyData = await getCompanyData(companyName);

  const students = await loadStudent(`${companyName}_${date}`);

  const finalResult = await Promise.all(
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

  console.log(finalResult);

  const cardContainer = document.querySelector(".card-container");

  finalResult.forEach((student) => {
    const studentCard = document.createElement("div");
    studentCard.classList.add("col-lg-4", "col-md-6");
    studentCard.setAttribute("data-bs-toggle", "modal");
    studentCard.setAttribute("data-bs-target", "#viewAttendanceModal");
    studentCard.setAttribute("data-student-id", `${student.userId}`);
    studentCard.setAttribute("data-date", `${student.date}`);

    studentCard.innerHTML = `
      <div class="mb-3 curved-border-container">
        <div class="overlay" style="background: url('${
          student.companyImage || "../assets/img/OC.jpg"
        }') no-repeat center center/cover;">
            <div class="overlay-dark"></div>
        </div>

        <div class="content d-flex justify-content-start align-items-center">
          <img
            id="user_profile"
            src="${
              student.image || "../assets/img/icons8_male_user_480px_1.png"
            }"
            alt="student-profile"
            class="img-fluid rounded-circle me-3"
          />
          <div class="text-container">
            <h6>${formatName(student)}</h6>
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
      populateAttendanceModal(student);
    });

    cardContainer.appendChild(studentCard);
  });
});

async function populateAttendanceModal(student) {
  try {
    // Check if student object has userId
    if (!student || !student.userId) {
      console.error("No student or userId provided");
      return;
    }

    const userId = student.userId;

    // Get all date subcollections for this user
    const dateSubcollections = await firebaseCRUD.listSubcollections(
      "attendancelogs",
      userId
    );

    // We'll store all attendance data here
    const attendanceData = [];

    // Loop through each date subcollection
    for (const dateCol of dateSubcollections) {
      const date = dateCol.id;

      // Get all attendance records for this date
      const snapshot = await firebaseCRUD.queryData(
        `attendancelogs/${userId}/${date}`,
        null,
        null,
        null
      );

      // Prepare date attendance object
      const dateAttendance = {
        date: date,
        morningTimeIn: null,
        morningTimeOut: null,
        afternoonTimeIn: null,
        afternoonTimeOut: null,
      };

      // Process each document
      snapshot.forEach((doc) => {
        const data = doc;
        const type = data.type;

        if (type === "morningTimeIn") {
          dateAttendance.morningTimeIn = {
            time: data.time,
            image: data.image,
            timestamp: data.timestamp.toDate().toLocaleString(),
          };
        } else if (type === "morningTimeOut") {
          dateAttendance.morningTimeOut = {
            time: data.time,
            image: data.image,
            timestamp: data.timestamp.toDate().toLocaleString(),
          };
        } else if (type === "afternoonTimeIn") {
          dateAttendance.afternoonTimeIn = {
            time: data.time,
            image: data.image,
            timestamp: data.timestamp.toDate().toLocaleString(),
          };
        } else if (type === "afternoonTimeOut") {
          dateAttendance.afternoonTimeOut = {
            time: data.time,
            image: data.image,
            timestamp: data.timestamp.toDate().toLocaleString(),
          };
        }
      });

      attendanceData.push(dateAttendance);
    }

    // Sort by date (newest first)
    attendanceData.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Now populate the modal with this data
    populateHistoryModal(attendanceData, student);
  } catch (error) {
    console.error("Error fetching attendance data:", error);
    // Show error to user
    alert("Failed to load attendance data. Please try again.");
  }
}

function populateHistoryModal(attendanceData, student) {
  const modal = new bootstrap.Modal(
    document.getElementById("viewHistoryModal")
  );
  const modalTitle = document.querySelector("#viewHistoryModal .modal-title");
  const historyImages = document.querySelectorAll(".history-images");

  // Clear previous data
  historyImages.forEach((container) => {
    container.innerHTML = "";
  });

  if (attendanceData.length === 0) {
    // Show empty state
    historyImages[0].innerHTML = "<p>No attendance records found</p>";
    return;
  }

  // Get the most recent record (first item after sorting)
  const latestRecord = attendanceData[0];

  // Populate morning section
  const morningContainer = historyImages[0];
  if (latestRecord.morningTimeIn) {
    morningContainer.innerHTML += createTimeRecordElement(
      latestRecord.morningTimeIn,
      "Time In"
    );
  }
  if (latestRecord.morningTimeOut) {
    morningContainer.innerHTML += createTimeRecordElement(
      latestRecord.morningTimeOut,
      "Time Out"
    );
  }

  // Populate afternoon section
  const afternoonContainer = historyImages[1];
  if (latestRecord.afternoonTimeIn) {
    afternoonContainer.innerHTML += createTimeRecordElement(
      latestRecord.afternoonTimeIn,
      "Time In"
    );
  }
  if (latestRecord.afternoonTimeOut) {
    afternoonContainer.innerHTML += createTimeRecordElement(
      latestRecord.afternoonTimeOut,
      "Time Out"
    );
  }

  // Set modal title with student name and date
  const formattedDate = new Date(latestRecord.date).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );
  modalTitle.textContent = `${student.name}'s Attendance - ${formattedDate}`;

  // Show the modal
  modal.show();
}

function createTimeRecordElement(record, label) {
  return `
    <div class="d-flex justify-content-center flex-column align-items-center mb-3">
      <h6 class="text-white mb-2">${label}</h6>
      <div class="time-badge mb-2">${record.time}</div>
      ${
        record.image
          ? `
        <a href="#" class="view-image-link" data-image="${record.image}">
          <img src="${record.image}" alt="Attendance image" class="img-fluid rounded attendance-image">
        </a>
      `
          : '<p class="text-white">No image available</p>'
      }
    </div>
  `;
}

// Add event listener for image clicks (to show in larger view)
document.addEventListener("click", function (e) {
  if (e.target.closest(".view-image-link")) {
    e.preventDefault();
    const imageSrc = e.target
      .closest(".view-image-link")
      .getAttribute("data-image");
    showImageModal(imageSrc);
  }
});

function showImageModal(imageSrc) {
  const imageModal = new bootstrap.Modal(
    document.getElementById("viewImageModal")
  );
  const modalImage = document.querySelector("#viewImageModal .modal-body img");

  if (modalImage) {
    modalImage.src = imageSrc;
    imageModal.show();
  }
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
