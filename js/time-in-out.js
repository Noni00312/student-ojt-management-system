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

  if (!currentModal) {
    currentModal = new bootstrap.Modal(cameraModalElem);
  }
  video.classList.remove("d-none");
  canvas.classList.add("d-none");
  confirmButton.style.op;
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
  const context = canvas.getContext("2d");
  const confirmButton = document.getElementById("confirm-img");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  video.classList.add("d-none");
  canvas.classList.remove("d-none");
  // confirmButton.removeAttribute("disabled");

  const imageData = canvas.toDataURL("image/png");
  console.log("Captured image:", imageData.substring(0, 30) + "...");
});

document.getElementById("retry").addEventListener("click", function () {
  const video = document.getElementById("video");
  const canvas = document.getElementById("canvas");

  canvas.classList.add("d-none");
  video.classList.remove("d-none");
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

  // Set the preview image source
  const preview = document.getElementById("preview");
  const retryAgain = document.getElementById("retry-again");
  preview.src = imageData;

  // Hide the camera button
  const cameraButton = document.getElementById("camera-button");
  cameraButton.classList.add("d-none");

  // Show the preview image
  preview.classList.remove("d-none");
  retryAgain.classList.remove("d-none");

  // Optional: also hide the modal if needed
  const cameraModal = bootstrap.Modal.getInstance(
    document.getElementById("cameraModal")
  );
  cameraModal.hide();
});

document.getElementById("retry-again").addEventListener("click", function () {
  const preview = document.getElementById("preview");
  const openCameraBtn = document.getElementById("camera-button");
  const retryAgain = document.getElementById("retry-again");

  openCameraBtn.classList.remove("d-none");
  preview.classList.add("d-none");
  cameraAccess();
  retryAgain.classList.add("d-none");
});
