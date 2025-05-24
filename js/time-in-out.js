document.addEventListener("click", function (event) {
  const clickedImg = event.target;

  if (
    clickedImg.tagName === "IMG" &&
    (clickedImg.id === "morning-in-img" ||
      clickedImg.id === "morning-out-img" ||
      clickedImg.id === "afternoon-in-img" ||
      clickedImg.id === "afternoon-out-img")
  ) {
    const modalImage = document.getElementById("modalImage");
    modalImage.src = clickedImg.src;

    const imageModal = new bootstrap.Modal(
      document.getElementById("imageModal")
    );
    imageModal.show();
  }
});

document
  .getElementById("absent-incident-submit")
  .addEventListener("click", async function (e) {
    const button = e.target;
    button.disabled = true;
    button.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Submitting...`;

    if (!navigator.onLine) {
      Swal.fire({
        icon: "error",
        title: "No Connection",
        text: "You are offline. Please connect to the internet first.",
        confirmButtonColor: "#590f1c",
      });
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
      Swal.fire({
        icon: "error",
        title: "No Explanation Provided",
        text: "Please state your explanation before trying to submit.",
        confirmButtonColor: "#590f1c",
      });
      button.disabled = false;
      button.innerHTML = `Submit`;
      return;
    }

    const date = new Date();
    const today =
      date.getFullYear() +
      "-" +
      String(date.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(date.getDate()).padStart(2, "0");

    const absentModal = bootstrap.Modal.getInstance(
      document.getElementById("absentModal")
    );

    const userInfoArr = await crudOperations.getByIndex(
      "studentInfoTbl",
      "userId",
      userId
    );

    const userInfo = userInfoArr[0];

    try {
      const { firebaseCRUD } = await import("./firebase-crud.js");

      const attendanceStatus = {
        userId,
        date: today,
        status: "absent",
        workHours: 0,
        workMinutes: 0,
        totalMinutes: 0,
        isLate: false,
        isPresent: false,
        companyName: userInfo.companyName,
        companyAddress: userInfo.companyAddress,
      };

      await crudOperations.upsert("completeAttendanceTbl", attendanceStatus);

      const incidentData = {
        userId,
        date: today,
        reason,
        report: reportText,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      };

      const incidentDocPath = `incidentreports`;

      await firebaseCRUD.createData(incidentDocPath, incidentData);
      await firebaseCRUD.createData("completeAttendanceTbl", attendanceStatus);
      descriptionField.value = "";

      const dateDocPath = `attendancelogs/${userId}/${today}`;

      const statusData = {
        attendanceStatus: "Absent",
        uploadedAt: new Date().toISOString(),
      };

      await firebaseCRUD.setDataWithId(dateDocPath, "status", statusData);

      Swal.fire({
        icon: "success",
        title: "Excuse Letter Submitted",
        text: "Absent report successfully submitted.",
        timer: 2000,
        showConfirmButton: false,
      });
      descriptionField.value = "";
      updateAttendanceButtonState();
      absentModal.hide();
    } catch (err) {
      console.error("Failed to upload incident report:", err);
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: "Failed to upload incident report. Please try again.",
        confirmButtonColor: "#590f1c",
      });
    } finally {
      button.disabled = false;
      button.innerHTML = `Submit`;
    }
  });

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
    Swal.fire({
      icon: "warning",
      title: "Camera Not Supported",
      text: "Your browser does not support camera access.",
      confirmButtonColor: "#590f1c",
    });
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
    Swal.fire({
      icon: "error",
      title: "No Other Camera Available",
      text: "Only one camera available.",
      confirmButtonColor: "#590f1c",
    });
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
  Swal.fire({
    icon: "error",
    title: "Camera Failed",
    text: message,
    confirmButtonColor: "#590f1c",
  });
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

async function checkCompletionStatus(userId, date) {
  await window.dbReady;

  const allStudentData = await crudOperations.getAllData("studentInfoTbl");
  const userData = allStudentData.find((item) => item.userId === userId);
  if (!userData) return null;

  const completedAttendance = await crudOperations.getAllData(
    "completeAttendanceTbl"
  );

  const completionEntry = completedAttendance.find(
    (entry) => entry.userId == userId && entry.today == date
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
  const { firebaseCRUD } = await import("./firebase-crud.js");
  const userId = localStorage.getItem("userId");
  await window.dbReady;

  if (!userId) return;

  const date = new Date();
  const today =
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0");

  const button = document.getElementById("time-in-out-button");
  const cameraBtn = document.getElementById("camera-button");
  const uploadBtn = document.getElementById("upload-btn");
  const absentButton = document.getElementById("absent-button");
  absentButton.disable = true;

  const studentDocs = await firebaseCRUD.queryData(
    "students",
    "userId",
    "==",
    userId
  );
  const userData = studentDocs[0];
  if (!userData) return;

  const status = await checkCompletionStatus(userId, today);
  if (status === "complete" || status === "absent") {
    button.textContent = "Attendance Already Completed Today";
    button.disabled = true;
    cameraBtn.disabled = true;
    absentButton.disabled = true;
    uploadBtn.classList.add("d-none");
    return;
  }

  const { data: attendanceData } = await firebaseCRUD.getSubcollectionData(
    userId,
    today
  );

  const todayLogs = (attendanceData || []).map((entry) => {
    const key = Object.keys(entry).find((k) => k !== "id");
    return entry[key];
  });

  absentButton.disabled = todayLogs.length > 0;

  const currentTime = getCurrentTimeInMinutes();
  const slot = getTimeSlot(currentTime, userData);
  currentSlot = slot;

  const isLogged = (slotName) => todayLogs.some((log) => log.type === slotName);

  if (slot === "morningTimeIn" && !isLogged("morningTimeIn")) {
    button.textContent = "Time In";
    absentButton.disabled = false;
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

document.getElementById("upload-now-btn").addEventListener("click", () => {
  handleUploadClick();
});

document.getElementById("upload-later-btn").addEventListener("click", () => {
  document.getElementById("upload-btn").classList.remove("d-none");
});

document
  .getElementById("upload-modal")
  .addEventListener("hidden.bs.modal", () => {
    document.getElementById("upload-btn").classList.remove("d-none");
  });

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
  await checkSkipIncidentReport(userId);

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
  const date = new Date();
  const today =
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0");
  await updateAttendanceButtonState();
  const status = await checkCompletionStatus(userId, today);
  if (status !== "complete" && status !== "absent") {
    await populateAttendanceImages();
  }

  setInterval(updateAttendanceButtonState, 8000);

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
  .addEventListener("click", async function (e) {
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
      Swal.fire({
        icon: "warning",
        title: "No Photo",
        text: "Please take a photo first.",
        confirmButtonColor: "#590f1c",
      });
      return;
    }
    const button = e.target;
    button.disabled = true;
    button.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Submitting...`;

    await window.dbReady;
    const userId = localStorage.getItem("userId");
    const attendanceDate = convertToISODate(dateEl);
    const attendanceTime = convertTo24Hour(timeEl);
    const date = new Date();
    const { firebaseCRUD } = await import("./firebase-crud.js");
    const today =
      date.getFullYear() +
      "-" +
      String(date.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(date.getDate()).padStart(2, "0");
    const isTimeIn = () => {
      if (
        currentSlot === "morningTimeIn" ||
        currentSlot === "afternoonTimeIn"
      ) {
        return "Time in";
      } else {
        return "Time out";
      }
    };

    try {
      const logData = {};
      if (navigator.onLine) {
        const { count, data: attendanceData } =
          await firebaseCRUD.getSubcollectionData(userId, today);
        const alreadyLogged = attendanceData.some((log) => {
          const slotKey = Object.keys(log).find((key) => key !== "id");
          const entry = log[slotKey];

          return (
            entry?.date === today &&
            entry?.type === currentSlot &&
            entry?.userId === userId
          );
        });

        const hasStatus = attendanceData.some((doc) => doc.id === "status");

        if (alreadyLogged) {
          Swal.fire({
            icon: "error",
            title: "Log Exist",
            text: `You've already logged ${currentSlot.replace(
              /([A-Z])/g,
              " $1"
            )} today.`,
            confirmButtonColor: "#590f1c",
          });
          return;
        }

        const sizeInBytes = getBase64Size(imgBase64);
        let imageToUse = imgBase64;

        if (sizeInBytes > 1048576) {
          imageToUse = await compressImageToUnder1MB(imgBase64);
        }

        const dateDocPath = `attendancelogs/${userId}/${attendanceDate}`;

        logData[currentSlot] = {
          timestamp: new Date().toISOString() ? new Date().toISOString() : null,
          date: attendanceDate,
          time: attendanceTime || null,
          userId: userId,
          type: currentSlot,
          image: imageToUse || null,
          uploadedAt: new Date().toISOString(),
        };

        const statusData = {
          attendanceStatus: "Present",
          uploadedAt: new Date().toISOString(),
        };

        const cleanData = Object.fromEntries(
          Object.entries(logData).filter(([_, value]) => value !== undefined)
        );

        await firebaseCRUD.setDataWithId(dateDocPath, currentSlot, cleanData);
        if (!hasStatus) {
          await firebaseCRUD.setDataWithId(dateDocPath, "status", statusData);
        }

        await firebaseCRUD.updateData("studentattendanceupdate", userId, {
          lastAttendanceUpdate: new Date().toISOString(),
        });

        await populateAttendanceImages(attendanceData);
        const { data: updatedAttendanceData } =
          await firebaseCRUD.getSubcollectionData(userId, today);

        const hasAfternoonTimeOut = updatedAttendanceData.some((log) => {
          const slotKey = Object.keys(log).find((key) => key !== "id");
          const entry = log[slotKey];
          return entry?.type === "afternoonTimeOut";
        });

        if (!hasAfternoonTimeOut) {
          await Swal.fire({
            icon: "success",
            title: "Success",
            text: "Log recorded successfully.",
            timer: 2000,
            showConfirmButton: false,
          });
        }

        if (hasAfternoonTimeOut) {
          await attendanceCompletion();
        } else {
          await updateAttendanceButtonState();
        }
        // incident function
      } else {
        console.log("Offline mode: Data not uploaded to Firebase.");
        Swal.fire({
          icon: "error",
          title: "No Connection",
          text: "Your currently in offline. Please check your connection and try again.",
          confirmButtonColor: "#590f1c",
        });
        button.disabled = false;
        button.innerHTML = isTimeIn();
        return;
      }

      document
        .querySelector(".attendance-detail-container")
        .classList.add("d-none");
      document.getElementById("preview").classList.add("d-none");
      document.getElementById("retry-again").classList.add("d-none");
      document.getElementById("camera-button").classList.remove("d-none");
      document.getElementById("absent-button").disabled = true;
      document.getElementById("attendance-time").textContent = "";
      document.getElementById("attendance-date").textContent = "";
      document.getElementById("attendance-img").textContent = "";
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Something went wrong",
        text: "Failed to record attendance.",
        confirmButtonColor: "#590f1c",
      });
      button.disabled = false;
      button.innerHTML = isTimeIn();
      console.error(error);
      return;
    }
  });

async function checkSkipIncidentReport(userId) {
  const { firebaseCRUD } = await import("./firebase-crud.js");

  const results = await firebaseCRUD.queryData(
    "studentattendanceupdate",
    "userId",
    "==",
    userId
  );

  if (results.length === 0) return;

  const lastDate = results[0].lastAttendanceUpdate.split("T")[0];
  const date = new Date();
  const today = date.toISOString().split("T")[0];

  const { data: updatedAttendanceData } =
    await firebaseCRUD.getSubcollectionData(userId, lastDate);

  const isComplete = checkLogCompleteness(updatedAttendanceData);

  if (isComplete) return;

  const incidentResult = await firebaseCRUD.queryData(
    "incidentreports",
    "userId",
    "==",
    userId
  );

  const hasExistingIncident = incidentResult.some((report) => {
    const reportDate = new Date(report.date).toISOString().split("T")[0];
    return reportDate === lastDate;
  });

  if (hasExistingIncident) return;

  if (results[0].hasIncident === true) {
    showIncidentModal(userId, lastDate, updatedAttendanceData);
  }
}

async function populateAttendanceImages() {
  await window.dbReady;
  const { firebaseCRUD } = await import("./firebase-crud.js");

  const userId = localStorage.getItem("userId");
  if (!userId) return;

  const date = new Date();
  const today =
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0");
  const { count, data: attendanceData } =
    await firebaseCRUD.getSubcollectionData(userId, today);
  const imageSlots = document.querySelectorAll(".attendance-slot");

  imageSlots.forEach((img) => {
    const type = img.getAttribute("data-type");

    const match = attendanceData.find((log) => {
      const slotKey = Object.keys(log).find((key) => key !== "id");
      return log[slotKey]?.type === type;
    });

    const container = img.closest(".img-container");
    const timeStamp = container.querySelector(".time-stamp");

    if (match) {
      const slotKey = Object.keys(match).find((key) => key !== "id");
      const data = match[slotKey];

      img.src = data.image || "../assets/img/icons8_no_image_500px.png";
      if (timeStamp) {
        timeStamp.textContent = data.time ? `Captured at: ${data.time}` : "";
      }
    } else {
      img.src = "../assets/img/icons8_no_image_500px.png";
      if (timeStamp) {
        timeStamp.textContent = "";
      }
    }
  });
}

/**
 * Calculates the total worked hours and minutes of a user based on their attendance logs
 * and compares them to the scheduled attendance times to determine lateness and presence.
 *
 * @function
 * @param {Array<Object>} logs - Array of attendance log objects, each containing:
 *   - {string} type - The type of log (e.g., 'morningTimeIn', 'morningTimeOut').
 *   - {string} time - Time in "HH:MM" format.
 * @param {Object} schedule - The user's schedule for the day, including:
 *   - {string} morningTimeIn - Scheduled morning time-in (HH:MM).
 *   - {string} morningTimeOut - Scheduled morning time-out (HH:MM).
 *   - {string} afternoonTimeIn - Scheduled afternoon time-in (HH:MM).
 *   - {string} afternoonTimeOut - Scheduled afternoon time-out (HH:MM).
 *
 * @returns {Object} An object containing:
 *   - {number} hours - Total worked hours (rounded down).
 *   - {number} minutes - Remaining minutes after hours are extracted.
 *   - {number} totalMinutes - Total worked minutes.
 *   - {boolean} isLate - True if the user was late for either morning or afternoon session.
 *   - {boolean} isPresent - True if the user has any time-in log.
 *
 * @example
 * const logs = [
 *   { type: "morningTimeIn", time: "08:10" },
 *   { type: "morningTimeOut", time: "12:00" },
 *   { type: "afternoonTimeIn", time: "13:05" },
 *   { type: "afternoonTimeOut", time: "17:00" }
 * ];
 * const schedule = {
 *   morningTimeIn: "08:00",
 *   morningTimeOut: "12:00",
 *   afternoonTimeIn: "13:00",
 *   afternoonTimeOut: "17:00"
 * };
 * const result = calculateWorkHours(logs, schedule);
 * // result = { hours: 7, minutes: 55, totalMinutes: 475, isLate: true, isPresent: true }
 */
async function calculateWorkHours(logs, schedule) {
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
  if (
    actualMorningIn !== null &&
    actualMorningOut !== null &&
    actualMorningOut >= actualMorningIn
  ) {
    const start = Math.max(actualMorningIn, scheduleMorningIn);
    const end = Math.min(actualMorningOut, scheduleMorningOut);
    morningDuration = Math.max(0, end - start);
  }

  let afternoonDuration = 0;
  if (
    actualAfternoonIn !== null &&
    actualAfternoonOut !== null &&
    actualAfternoonOut >= actualAfternoonIn
  ) {
    const start = Math.max(actualAfternoonIn, scheduleAfternoonIn);
    const end = Math.min(actualAfternoonOut, scheduleAfternoonOut);
    afternoonDuration = Math.max(0, end - start);
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

async function attendanceCompletion() {
  const { firebaseCRUD } = await import("./firebase-crud.js");
  const userId = localStorage.getItem("userId");
  const date = new Date();
  const today =
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0");
  const { count, data: attendanceData } =
    await firebaseCRUD.getSubcollectionData(userId, today);

  const isComplete = checkLogCompleteness(attendanceData);
  const isLate = await detectLateness(userId, attendanceData);

  if (!isComplete || isLate) {
    await firebaseCRUD.updateData("studentattendanceupdate", userId, {
      hasIncident: true,
    });
    showIncidentModal(userId, today, attendanceData);
  } else {
    await uploadLogs(userId, today, attendanceData);
  }
}

/**
 * Converts a time string in "HH:MM" format to total minutes.
 *
 * @function toMinutes
 * @param {string} t - Time string (e.g., "08:30")
 * @returns {number} Total minutes from midnight
 */
function toMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
/**
 * Checks if all required attendance log types are present.
 * Required types: morningTimeIn, morningTimeOut, afternoonTimeIn, afternoonTimeOut
 *
 * @function checkLogCompleteness
 * @param {Array<Object>} attendanceData - Attendance logs from Firebase subcollection
 * @returns {boolean} True if all required types are present, otherwise false
 */
function checkLogCompleteness(attendanceData) {
  const requiredTypes = [
    "morningTimeIn",
    "morningTimeOut",
    "afternoonTimeIn",
    "afternoonTimeOut",
  ];

  const flatLogs = attendanceData.map((entry) => {
    const key = Object.keys(entry).find((k) => k !== "id");
    return entry[key];
  });

  const typesLogged = flatLogs.map((log) => log.type);
  return requiredTypes.every((type) => typesLogged.includes(type));
}

/**
 * Determines if the user was late for morning or afternoon based on their schedule.
 *
 * @function detectLateness
 * @async
 * @param {string} userId - Unique user ID
 * @param {Array<Object>} attendanceData - Attendance logs from Firebase subcollection
 * @returns {Promise<boolean>} True if the user was late in either session, otherwise false
 */
async function detectLateness(userId, attendanceData) {
  const studentInfoArr = await crudOperations.getByIndex(
    "studentInfoTbl",
    "userId",
    userId
  );
  const studentInfo = studentInfoArr[0];

  const schedule = {
    morningTimeIn: studentInfo.morningTimeIn,
    afternoonTimeIn: studentInfo.afternoonTimeIn,
  };

  const flatLogs = attendanceData.map((entry) => {
    const key = Object.keys(entry).find((k) => k !== "id");
    return entry[key];
  });

  const actualMorningIn = flatLogs.find((log) => log.type === "morningTimeIn");
  const actualAfternoonIn = flatLogs.find(
    (log) => log.type === "afternoonTimeIn"
  );

  const isLateMorning =
    actualMorningIn &&
    toMinutes(actualMorningIn.time) > toMinutes(schedule.morningTimeIn);

  const isLateAfternoon =
    actualAfternoonIn &&
    toMinutes(actualAfternoonIn.time) > toMinutes(schedule.afternoonTimeIn);

  return isLateMorning || isLateAfternoon;
}
/**
 * Displays the incident modal for the user to submit a report about lateness or incomplete logs.
 * Upon submission:
 * - Validates reason and explanation
 * - Submits report to Firebase
 * - Proceeds with uploading logs
 *
 * @function showIncidentModal
 * @param {string} userId - User ID
 * @param {string} date - Date of the incident in YYYY-MM-DD format
 * @param {Array<Object>} logsForDate - Attendance logs from Firebase subcollection,
 *        each log is an object like { id: "morningTimeIn", morningTimeIn: { ... } }
 */
function showIncidentModal(userId, date, logsForDate) {
  const incidentModal = new bootstrap.Modal(
    document.getElementById("incidentModal")
  );
  const submitIncidentBtn = document.getElementById("incident-submit");

  incidentModal.show();
  submitIncidentBtn.disabled = false;
  submitIncidentBtn.innerHTML = `Submit Report`;

  submitIncidentBtn.onclick = async () => {
    const reportText = document.getElementById("incident-text").value.trim();
    const reason = document.getElementById("incident-reason").value;

    if (!reason) {
      Swal.fire({
        icon: "warning",
        title: "No Reason",
        text: "Please select a reason for the incident.",
        confirmButtonColor: "#590f1c",
      });
      return;
    }
    if (!reportText) {
      Swal.fire({
        icon: "warning",
        title: "No Explaination",
        text: "Please explain the incident before submitting.",
        confirmButtonColor: "#590f1c",
      });
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

      await firebaseCRUD.createData("incidentreports", incidentData);

      incidentModal.hide();

      const flattenedLogs = logsForDate.map((entry) => {
        const key = Object.keys(entry).find((k) => k !== "id");
        return entry[key];
      });

      await firebaseCRUD.updateData("studentattendanceupdate", userId, {
        hasIncident: false,
      });
      await uploadLogs(userId, date, flattenedLogs);
    } catch (err) {
      console.error("Failed to upload incident report:", err);
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: "Failed to upload incident report. Please try again.",
        confirmButtonColor: "#590f1c",
      });
      submitIncidentBtn.disabled = false;
      submitIncidentBtn.innerHTML = `Submit Report`;
    }
  };
}

/**
 * Uploads the user's logs and attendance status to Firebase and IndexedDB.
 *
 * Expected log format:
 * Each entry in `logsForDate` is an object like:
 * { id: "morningTimeIn", morningTimeIn: { userId, date, time, type, image, ... } }
 *
 * Function flow:
 * - Flattens the log entries to extract inner data objects
 * - Prepares log data and maps them by type
 * - Calculates total work hours from schedule
 * - Detects lateness in morning or afternoon time-in
 * - Uploads each log to Firebase at `attendancelogs/[userId]/[date]/[type]`
 * - Updates `completeAttendanceTbl` in both IndexedDB and Firebase
 * - Deletes temporary logs from IndexedDB
 * - Updates the UI on completion
 *
 * @function uploadLogs
 * @async
 * @param {string} userId - User ID
 * @param {string} date - Date string in YYYY-MM-DD format
 * @param {Array<Object>} logsForDate - Array of log entries from Firebase subcollection
 * @returns {Promise<void>}
 */
async function uploadLogs(userId, date, logsForDate) {
  const uploadBtn = document.getElementById("upload-btn");
  uploadBtn.disabled = true;
  uploadBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>`;

  try {
    const { firebaseCRUD } = await import("./firebase-crud.js");

    const cleanLogs = logsForDate.filter(
      (log) => log && typeof log === "object" && log.type && log.time
    );

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
    cleanLogs.forEach((log) => {
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

    const workHours = await calculateWorkHours(cleanLogs, schedule);

    const isLate =
      !logsByType["morningTimeIn"] ||
      !logsByType["afternoonTimeIn"] ||
      toMinutes(logsByType["morningTimeIn"].time) >
        toMinutes(schedule.morningTimeIn) ||
      toMinutes(logsByType["afternoonTimeIn"].time) >
        toMinutes(schedule.afternoonTimeIn);

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

    await firebaseCRUD.createData("completeAttendanceTbl", attendanceStatus);

    Swal.fire({
      icon: "success",
      title: "Upload Success",
      text: "Logs uploaded successfully.",
      timer: 2000,
      showConfirmButton: false,
    });
    uploadBtn.innerHTML = `Upload Attendance`;
    uploadBtn.classList.add("d-none");
    ClearData();
  } catch (error) {
    console.error("Upload failed:", error);
    Swal.fire({
      icon: "error",
      title: "Upload Failed",
      text: `Failed to upload logs: ${error.message}`,
      confirmButtonColor: "#590f1c",
    });
    uploadBtn.disabled = false;
    uploadBtn.innerHTML = `Upload Attendance`;
  }
}
/**
 * Clears all attendance-related UI fields.
 * - Resets text content for attendance time, date, and image info
 * - Clears all timestamp elements
 * - Resets all attendance-slot image elements to a fallback image
 *
 * @function ClearData
 * @returns {void}
 */
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
