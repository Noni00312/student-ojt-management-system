document
  .getElementById("absent-incident-submit")
  .addEventListener("click", async function (e) {
    const button = e.target;
    button.disabled = true;
    button.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Submitting...`;

    if (!navigator.onLine) {
      alert("You are offline. Please connect to the internet first.");
      x;
      button.disabled = false;
      button.innerHTML = `Submit`;
      return;
    }

    const userId = localStorage.getItem("userId");
    const reasonSelect = document.getElementById("absent-incident-header");
    const descriptionField = document.getElementById("absent-incident-text");
    const reason = reasonSelect.value;
    const reportText = descriptionField.value.trim();

    if (!reportText) {
      alert("Please state your explanation before trying to submit.");
      button.disabled = false;
      button.innerHTML = `Submit`;
      return;
    }

    const date = new Date().toISOString().split("T")[0];
    const absentModal = bootstrap.Modal.getInstance(
      document.getElementById("absentModal")
    );

    try {
      const { firebaseCRUD } = await import("./firebase-crud.js");

      const attendanceStatus = {
        userId,
        date,
        status: "absent",
        workHours: 0,
        workMinutes: 0,
        totalMinutes: 0,
        isLate: false,
        isPresent: false,
      };

      await crudOperations.upsert("completeAttendanceTbl", attendanceStatus);

      const incidentData = {
        userId,
        date,
        reason,
        report: reportText,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      };

      const incidentDocPath = `incidentreports`;

      await firebaseCRUD.createData(incidentDocPath, incidentData);

      descriptionField.value = "";

      absentModal.hide();
      alert("Absent report successfully saved.");
      checkCompletionStatus();
    } catch (err) {
      console.error("Failed to upload incident report:", err);
      alert("Failed to upload incident report. Please try again.");
    } finally {
      button.disabled = false;
      button.innerHTML = `Submit`;
    }
  });

// async function CheckSchedule() {
//   const userId = localStorage.getItem("userId");

//   const studentInfoArr = await crudOperations.getByIndex(
//     "studentInfoTbl",
//     "userId",
//     userId
//   );
//   const studentInfo = studentInfoArr[0];

//   const weeklySchedule = studentInfo.weeklySchedule;

//   const dayNames = ["SUN", "MON", "TUES", "WED", "THURS", "FRI", "SAT"];
//   const todayDay = new Date().getDay();
//   const today = dayNames[todayDay];

//   const hasScheduleToday = weeklySchedule[today] === true;

//   return hasScheduleToday;
// }

async function CheckSchedule() {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    return false;
  }

  const studentInfoArr = await crudOperations.getByIndex(
    "studentInfoTbl",
    "userId",
    userId
  );
  if (!studentInfoArr || studentInfoArr.length === 0) {
    return false;
  }

  const studentInfo = studentInfoArr[0];
  const weeklySchedule = studentInfo && studentInfo.weeklySchedule;
  if (!weeklySchedule || typeof weeklySchedule !== "object") {
    return false;
  }

  const dayNames = ["SUN", "MON", "TUE", "WED", "THURS", "FRI", "SAT"];
  const todayDay = new Date().getDay();
  const today = dayNames[todayDay];

  return weeklySchedule[today] === true;
}

let currentStream = null;
let currentFacingMode = "environment";
let currentModal = null;

async function cameraAccess() {
  const cameraModalElem = document.getElementById("cameraModal");

  if (!("mediaDevices" in navigator)) {
    alert("Your browser does not support camera access.");
    return;
  }

  try {
    if (currentStream) {
      currentStream.getTracks().forEach((track) => track.stop());
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: currentFacingMode,
      },
    });

    currentStream = stream;
    openCameraModal(stream);
  } catch (error) {
    console.error("Camera Error:", error);
    handleCameraError(error);
  }
}

document
  .getElementById("switch-cam-btn")
  .addEventListener("click", function () {
    currentFacingMode = currentFacingMode === "user" ? "environment" : "user";
    cameraAccess();
  });

async function getCameraDevices() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((device) => device.kind === "videoinput");
}

async function switchCamera() {
  const devices = await getCameraDevices();
  if (devices.length < 2) {
    alert("Only one camera available");
    return;
  }

  const currentDeviceId = currentStream
    .getVideoTracks()[0]
    .getSettings().deviceId;
  const newDevice = devices.find(
    (device) => device.deviceId !== currentDeviceId
  );

  if (newDevice) {
    const constraints = {
      video: {
        deviceId: { exact: newDevice.deviceId },
      },
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
      currentStream = stream;
      document.getElementById("video").srcObject = stream;
    } catch (error) {
      console.error("Error switching camera:", error);
    }
  }
}

function openCameraModal(stream) {
  const cameraModalElem = document.getElementById("cameraModal");
  const video = document.getElementById("video");
  const canvas = document.getElementById("canvas");
  const confirmButton = document.getElementById("confirm-img");
  const retry = document.getElementById("retry");

  if (!currentModal) {
    currentModal = new bootstrap.Modal(cameraModalElem);
  }
  video.classList.remove("d-none");
  canvas.classList.add("d-none");
  confirmButton.classList.add("d-none");
  retry.classList.add("d-none");
  video.srcObject = stream;
  video.play();

  cameraModalElem.addEventListener("hidden.bs.modal", onModalHidden);

  currentModal.show();
}

function onModalHidden() {
  if (currentStream) {
    currentStream.getTracks().forEach((track) => track.stop());
    currentStream = null;
  }

  if (currentModal) {
    currentModal.dispose();
    currentModal = null;
  }

  const cameraModalElem = document.getElementById("cameraModal");
  cameraModalElem.removeEventListener("hidden.bs.modal", onModalHidden);
}

function getBase64Size(base64String) {
  const base64 = base64String.split(",")[1];
  return Math.ceil((base64.length * 3) / 4);
}

async function compressImageToUnder1MB(imgElement, maxSizeBytes = 1048576) {
  let quality = 0.9;
  let maxWidth = imgElement.width;
  let maxHeight = imgElement.height;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  let base64;

  while (true) {
    canvas.width = maxWidth;
    canvas.height = maxHeight;
    ctx.clearRect(0, 0, maxWidth, maxHeight);
    ctx.drawImage(imgElement, 0, 0, maxWidth, maxHeight);

    base64 = canvas.toDataURL("image/jpeg", quality);
    const size = getBase64Size(base64);

    if (size <= maxSizeBytes || maxWidth < 100 || maxHeight < 100) {
      break;
    }
    quality -= 0.05;
    maxWidth *= 0.9;
    maxHeight *= 0.9;
    maxWidth = Math.floor(maxWidth);
    maxHeight = Math.floor(maxHeight);
  }

  return base64;
}

document.getElementById("captureBtn").addEventListener("click", function () {
  const video = document.getElementById("video");
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const confirmButton = document.getElementById("confirm-img");
  const retry = document.getElementById("retry");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.restore();

  video.classList.add("d-none");
  canvas.classList.remove("d-none");
  confirmButton.classList.remove("d-none");
  retry.classList.remove("d-none");

  const imageData = canvas.toDataURL("image/png");
});

document.getElementById("retry").addEventListener("click", function () {
  const video = document.getElementById("video");
  const canvas = document.getElementById("canvas");
  const confirmButton = document.getElementById("confirm-img");
  const retry = document.getElementById("retry");

  canvas.classList.add("d-none");
  video.classList.remove("d-none");
  confirmButton.classList.add("d-none");
  retry.classList.add("d-none");
});

function handleCameraError(error) {
  let message;
  switch (error.name) {
    case "NotAllowedError":
      message =
        "Camera access was denied. Check permissions in your browser or app settings.";
      break;
    case "NotFoundError":
      message = "No camera device found.";
      break;
    case "OverconstrainedError":
      message = "The camera does not support the requested settings.";
      break;
    case "NotReadableError":
      message = "Camera is already in use by another application.";
      break;
    default:
      message = "Could not access the camera. Error: " + error.message;
  }
  alert(message);
}

document.getElementById("confirm-img").addEventListener("click", function () {
  const canvas = document.getElementById("canvas");
  const imageData = canvas.toDataURL("image/png");

  const preview = document.getElementById("preview");
  const retryAgain = document.getElementById("retry-again");
  const attendaceDetail = document.querySelector(
    ".attendance-detail-container"
  );

  document.getElementById("attendance-date").textContent =
    document.getElementById("date").innerText;
  document.getElementById("attendance-time").textContent =
    document.getElementById("time").innerText;
  document.getElementById("attendance-img").textContent = imageData;
  preview.src = imageData;

  const cameraButton = document.getElementById("camera-button");
  cameraButton.classList.add("d-none");

  preview.classList.remove("d-none");
  retryAgain.classList.remove("d-none");
  attendaceDetail.classList.remove("d-none");

  const cameraModal = bootstrap.Modal.getInstance(
    document.getElementById("cameraModal")
  );
  cameraModal.hide();
});

document.getElementById("retry-again").addEventListener("click", function () {
  const preview = document.getElementById("preview");
  const openCameraBtn = document.getElementById("camera-button");
  const retryAgain = document.getElementById("retry-again");
  const attendaceDetail = document.querySelector(
    ".attendance-detail-container"
  );

  openCameraBtn.classList.remove("d-none");
  preview.classList.add("d-none");
  attendaceDetail.classList.add("d-none");
  cameraAccess();
  retryAgain.classList.add("d-none");
});

function convertTimeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

function getCurrentTimeInMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function getTimeSlot(currentMinutes, schedule) {
  const morningIn = convertTimeToMinutes(schedule.morningTimeIn);
  const morningOut = convertTimeToMinutes(schedule.morningTimeOut);
  const afternoonIn = convertTimeToMinutes(schedule.afternoonTimeIn);
  const afternoonOut = convertTimeToMinutes(schedule.afternoonTimeOut);

  if (currentMinutes >= morningIn - 60 && currentMinutes < morningOut) {
    return "morningTimeIn";
  }

  if (currentMinutes >= morningOut && currentMinutes < afternoonIn - 15) {
    return "morningTimeOut";
  }

  if (currentMinutes >= afternoonIn - 15 && currentMinutes < afternoonOut) {
    return "afternoonTimeIn";
  }

  if (currentMinutes >= afternoonOut) {
    return "afternoonTimeOut";
  }

  if (currentMinutes < morningIn - 60) {
    return "disabledUntilMorning";
  }

  return "waiting";
}

let currentSlot = "";

// async function checkCompletionStatus() {
//   const userId = localStorage.getItem("userId");
//   await window.dbReady;

//   const allStudentData = await crudOperations.getAllData("studentInfoTbl");
//   const userData = allStudentData.find((item) => item.userId === userId);
//   if (!userData) return null;

//   const today = new Date().toLocaleDateString("en-CA");
//   const completedAttendance = await crudOperations.getAllData(
//     "completeAttendanceTbl"
//   );

//   const completionEntry = completedAttendance.find(
//     (entry) => entry.userId === userId && entry.date === today
//   );

//   const status = completionEntry?.status;

//   const button = document.getElementById("time-in-out-button");
//   const cameraBtn = document.getElementById("camera-button");
//   const uploadBtn = document.getElementById("upload-btn");
//   const absentButton = document.getElementById("absent-button");

//   if (completionEntry) {
//     if (status === "complete") {
//       button.textContent = "Attendance Already Completed Today";
//     } else {
//       button.textContent = "You Are Absent For Today.";
//     }
//     button.disabled = true;
//     cameraBtn.disabled = true;
//     absentButton.disabled = true;
//     uploadBtn.classList.add("d-none");
//     return status;
//   }

//   return null;
// }

async function checkCompletionStatus(userId, date) {
  await window.dbReady;

  const allStudentData = await crudOperations.getAllData("studentInfoTbl");
  const userData = allStudentData.find((item) => item.userId === userId);
  if (!userData) return null;

  const completedAttendance = await crudOperations.getAllData(
    "completeAttendanceTbl"
  );

  const completionEntry = completedAttendance.find(
    (entry) => entry.userId === userId && entry.date === date
  );

  if (completionEntry) {
    return completionEntry.status;
  }

  try {
    const { firebaseCRUD } = await import("./firebase-crud.js");
    const onlineResults = await firebaseCRUD.queryData(
      "completeAttendanceTbl",
      "userId",
      "==",
      userId
    );
    const onlineEntry = onlineResults.find((entry) => entry.date === date);
    if (onlineEntry) {
      await crudOperations.upsert("completeAttendanceTbl", onlineEntry);
      return onlineEntry.status;
    }
  } catch (err) {
    console.warn("Could not check online attendance:", err);
  }
  return null;
}

async function updateAttendanceButtonState() {
  const userId = localStorage.getItem("userId");
  await window.dbReady;

  const allStudentData = await crudOperations.getAllData("studentInfoTbl");
  const userData = allStudentData.find((item) => item.userId === userId);
  if (!userData) return;

  const currentTime = getCurrentTimeInMinutes();
  const allLogs = await crudOperations.getAllData("timeInOut");
  const today = new Date().toLocaleDateString("en-CA");

  const button = document.getElementById("time-in-out-button");
  const cameraBtn = document.getElementById("camera-button");
  const uploadBtn = document.getElementById("upload-btn");
  const absentButton = document.getElementById("absent-button");

  const status = await checkCompletionStatus(userId, today);

  if (status === "complete" || status === "absent") {
    button.textContent = "Attendance Already Completed Today";
    button.disabled = true;
    cameraBtn.disabled = true;
    absentButton.disabled = true;
    uploadBtn.classList.add("d-none");
    return;
  }

  //----------- check if there is any log today ----- -- ///
  const userLogs = await crudOperations.getByIndex(
    "timeInOut",
    "userId",
    userId
  );

  const logsForDate = userLogs.filter((log) => log.date === today);

  if (logsForDate.length > 0) {
    absentButton.disabled = true;
  } else {
    absentButton.disabled = false;
  }

  //-------------------------------------
  const todayLogs = allLogs.filter(
    (log) => log.date === today && log.userId === userId
  );

  const isLogged = (slot) => todayLogs.some((log) => log.type === slot);

  const slot = getTimeSlot(currentTime, userData);
  currentSlot = slot;

  if (currentSlot !== "afternoonTimeOut") {
    uploadBtn.classList.add("d-none");
  } else {
    uploadBtn.classList.remove("d-none");
  }

  if (slot === "morningTimeIn" && !isLogged("morningTimeIn")) {
    button.textContent = "Time In";
    button.disabled = false;
    cameraBtn.disabled = false;
  } else if (slot === "morningTimeOut" && !isLogged("morningTimeOut")) {
    button.textContent = "Time Out";
    button.disabled = false;
    cameraBtn.disabled = false;
  } else if (slot === "afternoonTimeIn" && !isLogged("afternoonTimeIn")) {
    button.textContent = "Time In";
    button.disabled = false;
    cameraBtn.disabled = false;
  } else if (slot === "afternoonTimeOut" && !isLogged("afternoonTimeOut")) {
    button.textContent = "Time Out";
    button.disabled = false;
    cameraBtn.disabled = false;
  } else {
    button.textContent = "Not Time Yet";
    button.disabled = true;
    cameraBtn.disabled = true;
  }
}

// window.addEventListener("DOMContentLoaded", async () => {
//   await window.dbReady;
//   const userId = localStorage.getItem("userId");
//   if (!userId) {
//     return;
//   }

//   const dataArray = await crudOperations.getByIndex(
//     "studentInfoTbl",
//     "userId",
//     userId
//   );
//   const data = Array.isArray(dataArray) ? dataArray[0] : dataArray;

//   const img = document.getElementById("user-profile");
//   const timeInContainer = document.querySelector(".time-in-cotainer");
//   const logImgContainer = document.querySelector(".log-img-container");
//   const noSheduleContainer = document.querySelector(".no-schedule-container");
//   const absentButton = document.querySelector("#absent-button");
//   img.src = data.userImg
//     ? data.userImg
//     : "../assets/img/icons8_male_user_480px_1";

//   (async () => {
//     const hasScheduleToday = await CheckSchedule();
//     if (hasScheduleToday) {
//       noSheduleContainer.classList.add("d-none");
//       timeInContainer.classList.remove("d-none");
//       logImgContainer.classList.remove("d-none");
//       absentButton.classList.remove("d-none");
//     } else {
//       timeInContainer.classList.add("d-none");
//       logImgContainer.classList.add("d-none");
//       absentButton.classList.add("d-none");
//       noSheduleContainer.classList.remove("d-none");
//     }
//   })();

//   await updateAttendanceButtonState();
//   await populateAttendanceImages();
//   setInterval(updateAttendanceButtonState, 30000);
// });

window.addEventListener("DOMContentLoaded", async () => {
  await window.dbReady;
  const userId = localStorage.getItem("userId");
  const logContainer = document.querySelector(".log-img-container");
  logContainer.classList.add("d-none");
  if (!userId) {
    const overlay = document.getElementById("page-loading-overlay");
    if (overlay) overlay.style.display = "none";
    return;
  }

  const dataArray = await crudOperations.getByIndex(
    "studentInfoTbl",
    "userId",
    userId
  );
  const data = Array.isArray(dataArray) ? dataArray[0] : dataArray;

  const img = document.getElementById("user-profile");
  const timeInContainer = document.querySelector(".time-in-cotainer");
  const logImgContainer = document.querySelector(".log-img-container");
  const noSheduleContainer = document.querySelector(".no-schedule-container");
  const absentButton = document.querySelector("#absent-button");
  img.src = data.userImg
    ? data.userImg
    : "../assets/img/icons8_male_user_480px_1";

  (async () => {
    const hasScheduleToday = await CheckSchedule();
    if (hasScheduleToday) {
      noSheduleContainer.classList.add("d-none");
      timeInContainer.classList.remove("d-none");
      logImgContainer.classList.remove("d-none");
      absentButton.classList.remove("d-none");
    } else {
      timeInContainer.classList.add("d-none");
      absentButton.classList.add("d-none");
      noSheduleContainer.classList.remove("d-none");
    }
  })();

  await updateAttendanceButtonState();
  await populateAttendanceImages();
  setInterval(updateAttendanceButtonState, 8000);

  // --- Hide the overlay when ready ---
  const overlay = document.getElementById("page-loading-overlay");
  if (overlay) {
    overlay.style.opacity = "0";
    setTimeout(() => {
      overlay.style.display = "none";
    }, 300);
  }
});

document
  .getElementById("time-in-out-button")
  .addEventListener("click", async function () {
    const timeEl = document
      .getElementById("attendance-time")
      .textContent.trim();
    const imgBase64 = document
      .getElementById("attendance-img")
      .textContent.trim();
    const dateEl = document
      .getElementById("attendance-date")
      .textContent.trim();
    if (!timeEl || !imgBase64 || !dateEl) {
      alert("Please take a photo first.");
      return;
    }

    await window.dbReady;
    const userId = localStorage.getItem("userId");
    const attendanceDate = convertToISODate(dateEl);
    const attendanceTime = convertTo24Hour(timeEl);

    const allLogs = await crudOperations.getAllData("timeInOut");

    const alreadyLogged = allLogs.some(
      (log) =>
        log.date === attendanceDate &&
        log.type === currentSlot &&
        log.userId === userId
    );

    if (alreadyLogged) {
      alert(
        `You've already logged ${currentSlot.replace(/([A-Z])/g, " $1")} today.`
      );
      return;
    }

    const sizeInBytes = getBase64Size(imgBase64);
    let imageToUse = imgBase64;

    if (sizeInBytes > 1048576) {
      imageToUse = await compressImageToUnder1MB(imgBase64);
    }

    const userData = {
      userId,
      time: attendanceTime,
      date: attendanceDate,
      image: imageToUse,
      type: currentSlot,
    };

    try {
      await crudOperations.createData("timeInOut", userData);

      document
        .querySelector(".attendance-detail-container")
        .classList.add("d-none");
      document.getElementById("preview").classList.add("d-none");
      document.getElementById("retry-again").classList.add("d-none");
      document.getElementById("camera-button").classList.remove("d-none");
      document.getElementById("absent-button").disabled = true;

      alert("Attendance recorded successfully!");

      await populateAttendanceImages();
      updateAttendanceButtonState();

      document.getElementById("attendance-time").textContent = "";
      document.getElementById("attendance-date").textContent = "";
      document.getElementById("attendance-img").textContent = "";
    } catch (error) {
      alert("Failed to record attendance.");
      console.error(error);
    }
  });

async function populateAttendanceImages() {
  await window.dbReady;

  const userId = localStorage.getItem("userId");
  if (!userId) return;

  const allLogs = await crudOperations.getAllData("timeInOut");

  const today = new Date().toLocaleDateString("en-CA");
  const todayLogs = allLogs.filter(
    (log) => log.userId === userId && log.date === today
  );

  const imageSlots = document.querySelectorAll(".attendance-slot");

  imageSlots.forEach((img) => {
    const type = img.getAttribute("data-type");
    const match = todayLogs.find((log) => log.type === type);

    const container = img.closest(".img-container");
    const timeStamp = container.querySelector(".time-stamp");

    if (match) {
      img.src = match.image;
      if (timeStamp) {
        timeStamp.textContent = `Captured at: ${match.time}`;
      }
    } else {
      img.src = "../assets/img/icons8_no_image_500px.png";
      if (timeStamp) {
        timeStamp.textContent = "";
      }
    }
  });
}

// async function checkCompleteAttendance(userId, date) {
//   const allLogs = await crudOperations.getAllData("timeInOut");

//   const requiredTypes = [
//     "morningTimeIn",
//     "morningTimeOut",
//     "afternoonTimeIn",
//     "afternoonTimeOut",
//   ];

//   const todaysLogs = allLogs.filter(
//     (log) => log.userId === userId && log.date === date
//   );

//   const types = todaysLogs.map((log) => log.type);

//   return {
//     isComplete: requiredTypes.every((type) => types.includes(type)),
//     hasLogs: todaysLogs.length > 0,
//     logs: todaysLogs,
//   };
// }

function calculateWorkHours(logs, schedule) {
  function toMinutes(timeStr) {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  }

  const getLogTime = (type) => {
    const log = logs.find((log) => log.type === type);
    return log ? toMinutes(log.time) : null;
  };

  const scheduleMorningIn = toMinutes(schedule.morningTimeIn);
  const scheduleMorningOut = toMinutes(schedule.morningTimeOut);
  const scheduleAfternoonIn = toMinutes(schedule.afternoonTimeIn);
  const scheduleAfternoonOut = toMinutes(schedule.afternoonTimeOut);

  const actualMorningIn = getLogTime("morningTimeIn");
  const actualMorningOut = getLogTime("morningTimeOut");
  const actualAfternoonIn = getLogTime("afternoonTimeIn");
  const actualAfternoonOut = getLogTime("afternoonTimeOut");

  let morningDuration = 0;
  if (actualMorningIn !== null && actualMorningOut !== null) {
    const morningStart = Math.max(actualMorningIn, scheduleMorningIn);
    morningDuration = actualMorningOut - morningStart;
  }

  let afternoonDuration = 0;
  if (actualAfternoonIn !== null && actualAfternoonOut !== null) {
    const afternoonStart = Math.max(actualAfternoonIn, scheduleAfternoonIn);
    const afternoonEnd = Math.min(actualAfternoonOut, scheduleAfternoonOut);
    afternoonDuration = afternoonEnd - afternoonStart;
  }

  const totalMinutes = morningDuration + afternoonDuration;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const isPresent = actualMorningIn !== null || actualAfternoonIn !== null;
  const isLate =
    (actualMorningIn !== null && actualMorningIn > scheduleMorningIn) ||
    (actualAfternoonIn !== null && actualAfternoonIn > scheduleAfternoonIn);

  return { hours, minutes, totalMinutes, isLate, isPresent };
}

document
  .getElementById("upload-btn")
  .addEventListener("click", async function () {
    if (!navigator.onLine)
      return alert("You are offline. Please connect to the internet first.");

    const confirmUpload = confirm("Are you sure you want to upload this data?");
    if (!confirmUpload) return;

    const date = prompt("Enter the date to upload (YYYY-MM-DD):");
    if (!date) return alert("Upload cancelled. No date provided.");

    const userId = localStorage.getItem("userId");

    const userLogs = await crudOperations.getByIndex(
      "timeInOut",
      "userId",
      userId
    );

    const logsForDate = userLogs.filter((log) => log.date === date);

    if (logsForDate.length === 0) {
      alert("No attendance logs found for this date.");
      return;
    }

    const requiredTypes = [
      "morningTimeIn",
      "morningTimeOut",
      "afternoonTimeIn",
      "afternoonTimeOut",
    ];
    const typesLogged = logsForDate.map((log) => log.type);
    const isComplete = requiredTypes.every((type) =>
      typesLogged.includes(type)
    );

    const uploadBtn = document.getElementById("upload-btn");
    const submitIncidentBtn = document.getElementById("incident-submit");

    const toMinutes = (t) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };

    const uploadLogs = async () => {
      uploadBtn.disabled = true;
      uploadBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>`;

      try {
        const { firebaseCRUD } = await import("./firebase-crud.js");

        const userInfoArr = await crudOperations.getByIndex(
          "studentInfoTbl",
          "userId",
          userId
        );
        const userInfo = userInfoArr[0];

        const schedule = {
          morningTimeIn: userInfo.morningTimeIn,
          morningTimeOut: userInfo.morningTimeOut,
          afternoonTimeIn: userInfo.afternoonTimeIn,
          afternoonTimeOut: userInfo.afternoonTimeOut,
        };

        const logsByType = {};
        logsForDate.forEach((log) => {
          logsByType[log.type] = {
            timestamp: log.time
              ? new Date(`${log.date}T${log.time}`).toISOString()
              : null,
            date: log.date,
            time: log.time || null,
            userId: log.userId,
            type: log.type,
            image: log.image || null,
            uploadedAt: new Date().toISOString(),
          };
        });

        const workHours = calculateWorkHours(logsForDate, schedule);

        const lateMorning =
          logsByType["morningTimeIn"] &&
          toMinutes(logsByType["morningTimeIn"].time) >
            toMinutes(schedule.morningTimeIn);

        const lateAfternoon =
          logsByType["afternoonTimeIn"] &&
          toMinutes(logsByType["afternoonTimeIn"].time) >
            toMinutes(schedule.afternoonTimeIn);

        const isLate = lateMorning || lateAfternoon;

        const attendanceStatus = {
          userId,
          date,
          status: "complete",
          workHours: workHours.hours,
          workMinutes: workHours.minutes,
          totalMinutes: workHours.totalMinutes,
          isLate,
          isPresent: true,
          companyName: userInfo.companyName,
          companyAddress: userInfo.companyAddress,
        };

        const dateDocPath = `attendancelogs/${userId}/${date}`;
        for (const [type, logData] of Object.entries(logsByType)) {
          const cleanData = Object.fromEntries(
            Object.entries(logData).filter(([_, value]) => value !== undefined)
          );
          await firebaseCRUD.setDataWithId(dateDocPath, type, cleanData);
        }

        await crudOperations.upsert("completeAttendanceTbl", attendanceStatus);
        await firebaseCRUD.createData(
          "completeAttendanceTbl",
          attendanceStatus
        );

        for (const log of logsForDate) {
          await crudOperations.deleteData("timeInOut", log.id);
        }

        alert("Logs uploaded successfully.");
        uploadBtn.innerHTML = `Upload Attendance`;
        uploadBtn.classList.add("d-none");
        ClearData();
      } catch (error) {
        console.error("Upload failed:", error);
        alert(`Failed to upload logs: ${error.message}`);
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = `Upload Attendance`;
      }
    };

    const studentInfoArr = await crudOperations.getByIndex(
      "studentInfoTbl",
      "userId",
      userId
    );
    const studentInfo = studentInfoArr[0];

    const userSchedule = {
      morningTimeIn: studentInfo.morningTimeIn,
      afternoonTimeIn: studentInfo.afternoonTimeIn,
    };

    const actualMorningIn = logsForDate.find(
      (log) => log.type === "morningTimeIn"
    );
    const actualAfternoonIn = logsForDate.find(
      (log) => log.type === "afternoonTimeIn"
    );

    const isLateMorning =
      actualMorningIn &&
      toMinutes(actualMorningIn.time) > toMinutes(userSchedule.morningTimeIn);
    const isLateAfternoon =
      actualAfternoonIn &&
      toMinutes(actualAfternoonIn.time) >
        toMinutes(userSchedule.afternoonTimeIn);

    const isLate = isLateMorning || isLateAfternoon;

    if (!isComplete || isLate) {
      const incidentModal = new bootstrap.Modal(
        document.getElementById("incidentModal")
      );
      incidentModal.show();

      submitIncidentBtn.disabled = false;
      submitIncidentBtn.innerHTML = `Submit Report`;

      submitIncidentBtn.onclick = async () => {
        const reportText = document
          .getElementById("incident-text")
          .value.trim();
        const reason = document.getElementById("incident-reason").value;

        if (!reason) {
          alert("Please select a reason for the incident.");
          return;
        }

        if (!reportText) {
          alert("Please explain the incident before submitting.");
          return;
        }

        submitIncidentBtn.disabled = true;
        submitIncidentBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Submitting...`;

        try {
          const { firebaseCRUD } = await import("./firebase-crud.js");
          const incidentData = {
            userId,
            date,
            reason,
            report: reportText,
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
          };

          const incidentDocPath = `incidentreports`;

          await firebaseCRUD.createData(incidentDocPath, incidentData);

          incidentModal.hide();
          await uploadLogs();
        } catch (err) {
          console.error("Failed to upload incident report:", err);
          alert("Failed to upload incident report. Please try again.");
          submitIncidentBtn.disabled = false;
          submitIncidentBtn.innerHTML = `Submit Report`;
        }
      };
    } else {
      await uploadLogs();
    }
  });

function ClearData() {
  document.getElementById("attendance-time").textContent = "";
  document.getElementById("attendance-date").textContent = "";
  document.getElementById("attendance-img").textContent = "";

  document.querySelectorAll(".time-stamp").forEach((el) => {
    el.textContent = "";
  });

  const fallbackSrc = "../assets/img/icons8_no_image_500px.png";
  document.querySelectorAll(".attendance-slot").forEach((img) => {
    img.src = fallbackSrc;
    img.alt = "No image available";
  });
}
