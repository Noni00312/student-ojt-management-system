async function cameraAccess() {
  const cameraModal = document.getElementById("cameraModal");
  const isPWA = window.matchMedia("(display-mode: standalone)").matches;

  if (!("mediaDevices" in navigator)) {
    alert("Your browser does not support camera access.");
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });

    const modal = new bootstrap.Modal(cameraModal);
    modal.show();

    const video = document.getElementById("video");
    video.srcObject = stream;
    video.play();

    cameraModal.addEventListener("hidden.bs.modal", () => {
      stream.getTracks().forEach((track) => track.stop());
    });
  } catch (error) {
    console.error("Camera Error:", error);

    if (error.name === "NotAllowedError") {
      if (isPWA) {
        const shouldEnable = confirm(
          "Camera access is blocked. " +
            "Would you like to open device settings to enable camera permissions?"
        );

        if (shouldEnable) {
          try {
            window.open("app-settings:");

            setTimeout(cameraAccess, 1000);
          } catch (e) {
            alert(
              "Please enable camera permissions manually in your device settings."
            );
          }
        }
      } else {
        const shouldEnable = confirm(
          "Camera access is blocked. " +
            "Allow camera permissions in your browser settings and try again."
        );

        if (shouldEnable) {
          setTimeout(cameraAccess, 100);
        }
      }
    } else if (
      error.name === "NotFoundError" ||
      error.name === "OverconstrainedError"
    ) {
      alert("No camera device found or camera requirements not met.");
    } else {
      alert("Could not access the camera. Error: " + error.message);
    }
  }
}

function openCameraModal(stream) {
  const cameraModal = document.getElementById("cameraModal");
  const modal = new bootstrap.Modal(cameraModal);
  modal.show();

  const video = document.getElementById("video");
  video.srcObject = stream;
  video.play();

  cameraModal.addEventListener("hidden.bs.modal", () => {
    stream.getTracks().forEach((track) => track.stop());
  });
}

document.getElementById("captureBtn").addEventListener("click", function () {
  const video = document.getElementById("video");
  const canvas = document.getElementById("canvas");
  const context = canvas.getContext("2d");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  video.classList.add("d-none");
  canvas.classList.remove("d-none");

  const imageData = canvas.toDataURL("image/png");
});
