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
  console.log("Captured image:", imageData.substring(0, 30) + "...");
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

  if (currentMinutes < morningIn - 60) return "disabledUntilMorning";
  if (currentMinutes >= morningIn - 60 && currentMinutes < morningOut)
    return "morningTimeIn";
  if (currentMinutes >= morningOut && currentMinutes < afternoonIn)
    return "morningTimeOut";
  if (currentMinutes >= afternoonIn - 60 && currentMinutes < afternoonOut)
    return "afternoonTimeIn";
  if (currentMinutes >= afternoonOut) return "afternoonTimeOut";

  return "waiting";
}

let currentSlot = "";

async function updateAttendanceButtonState() {
  const userId = localStorage.getItem("userId");
  await window.dbReady;

  const allStudentData = await crudOperations.getAllData("studentInfoTbl");
  const userData = allStudentData.find((item) => item.userId === userId);
  if (!userData) return;

  const currentTime = getCurrentTimeInMinutes();
  const allLogs = await crudOperations.getAllData("timeInOut");
  const today = new Date().toISOString().split("T")[0];

  const completedAttendance = await crudOperations.getAllData(
    "completeAttendanceTbl"
  );
  const alreadyCompleted = completedAttendance.some(
    (entry) =>
      entry.userId === userId &&
      entry.date === today &&
      entry.status === "complete"
  );

  const button = document.getElementById("time-in-out-button");
  const cameraBtn = document.getElementById("camera-button");
  const uploadBtn = document.getElementById("upload-btn");

  if (alreadyCompleted) {
    button.textContent = "Attendance Already Completed Today";
    button.disabled = true;
    cameraBtn.disabled = true;
    uploadBtn.classList.add("d-none");
    return;
  }

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
    button.textContent = "mor Time In";
    button.disabled = false;
  } else if (slot === "morningTimeOut" && !isLogged("morningTimeOut")) {
    button.textContent = "mor Time Out";
    button.disabled = false;
    cameraBtn.disabled = false;
  } else if (slot === "afternoonTimeIn" && !isLogged("afternoonTimeIn")) {
    button.textContent = "aft Time In";
    button.disabled = false;
    cameraBtn.disabled = false;
  } else if (slot === "afternoonTimeOut" && !isLogged("afternoonTimeOut")) {
    button.textContent = "aft Time Out";
    button.disabled = false;
    cameraBtn.disabled = false;
  } else {
    button.textContent = "Attendance Complete or Not Time Yet";
    button.disabled = true;
    cameraBtn.disabled = true;
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  await window.dbReady;
  const userId = localStorage.getItem("userId");
  if (!userId) {
    console.warn("No user ID found in localStorage.");
    return;
  }

  updateAttendanceButtonState();
  await populateAttendanceImages();
  setInterval(updateAttendanceButtonState, 30000);
});

document
  .getElementById("time-in-out-button")
  .addEventListener("click", async function (event) {
    event.preventDefault();

    const timeEl = document
      .getElementById("attendance-time")
      .textContent.trim();
    const imgEl = document.getElementById("attendance-img").textContent.trim();
    const dateEl = document
      .getElementById("attendance-date")
      .textContent.trim();

    if (!timeEl || !imgEl || !dateEl) {
      alert("Please take a photo first.");
      return;
    }

    const attendanceDate = convertToISODate(dateEl);
    await window.dbReady;

    const userId = localStorage.getItem("userId");
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

    const attendanceTime = convertTo24Hour(timeEl);

    const userData = {
      userId,
      time: attendanceTime,
      date: attendanceDate,
      image: imgEl,
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
      document.getElementById("attendance-form").reset();

      alert("Attendance recorded successfully!");
      await populateAttendanceImages();
      updateAttendanceButtonState();
    } catch (error) {
      alert("Failed to record attendance.");
    }
  });

async function populateAttendanceImages() {
  await window.dbReady;

  const userId = localStorage.getItem("userId");
  if (!userId) {
    return;
  }

  const allLogs = await crudOperations.getAllData("timeInOut");
  const today = new Date().toISOString().split("T")[0];
  const todayLogs = allLogs.filter(
    (log) => log.userId === userId && log.date === today
  );

  const imageSlots = document.querySelectorAll(".attendance-slot");

  imageSlots.forEach((img) => {
    const type = img.getAttribute("data-type");
    const match = todayLogs.find((log) => log.type === type);

    if (match) {
      img.src = match.image;
    } else {
      img.src = "../assets/img/icons8_full_image_480px_1.png";
    }
  });
}

async function checkCompleteAttendance(userId, date) {
  const allLogs = await crudOperations.getAllData("timeInOut");

  const requiredTypes = [
    "morningTimeIn",
    "morningTimeOut",
    "afternoonTimeIn",
    "afternoonTimeOut",
  ];

  const todaysLogs = allLogs.filter(
    (log) => log.userId === userId && log.date === date
  );

  const types = todaysLogs.map((log) => log.type);

  return {
    isComplete: requiredTypes.every((type) => types.includes(type)),
    hasLogs: todaysLogs.length > 0,
    logs: todaysLogs,
  };
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

    const uploadLogs = async () => {
      uploadBtn.disabled = true;
      uploadBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Uploading...`;

      for (const log of logsForDate) {
        const { firebaseCRUD } = await import("./firebase-crud.js");
        await firebaseCRUD.createData("attendancelogs", log);
        await crudOperations.deleteData("timeInOut", log.id);
      }

      await crudOperations.upsert("completeAttendanceTbl", {
        userId: userId,
        date: date,
        status: "complete",
      });

      alert("Logs uploaded successfully.");
      uploadBtn.innerHTML = `Upload Attendance`;
      uploadBtn.classList.add("d-none");
    };

    if (!isComplete) {
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
        if (!reportText) {
          alert("Please explain the incident before submitting.");
          return;
        }

        submitIncidentBtn.disabled = true;
        submitIncidentBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Submitting...`;

        try {
          const { firebaseCRUD } = await import("./firebase-crud.js");
          await firebaseCRUD.createData("incidentReports", {
            userId,
            date,
            report: reportText,
            createdAt: new Date().toISOString(),
          });

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
