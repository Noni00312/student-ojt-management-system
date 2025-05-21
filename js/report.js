import { firebaseCRUD } from "./firebase-crud.js";

document.addEventListener("DOMContentLoaded", async function () {
  let db;
  const request = indexedDB.open("SOJTMSDB", 1);
  let currentReportId = null;
  let pendingImageChanges = {
    toAdd: [],
    toDelete: [],
  };

  request.onupgradeneeded = function (event) {
    db = event.target.result;

    if (db.objectStoreNames.contains("reportTbl")) {
      db.deleteObjectStore("reportTbl");
    }

    const store = db.createObjectStore("reportTbl", {
      keyPath: "id",
      autoIncrement: true,
    });

    store.createIndex("createdAt", "createdAt", { unique: false });
    store.createIndex("reportId", "reportId", { unique: true });
    store.createIndex("userId", "userId", { unique: false });
  };

  request.onsuccess = function (event) {
    db = event.target.result;
    displayReports();
    setupAddModal();
    setupViewModal();
    setupDateSearch();
    setupUploadButton();
  };

  request.onerror = function (event) {
    console.error("IndexedDB error:", event.target.error);
  };

  try {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      console.error("No userId found in localStorage");
      return;
    }

    await window.dbReady;

    const img = document.getElementById("user-profile");

    const dataArray = await crudOperations.getByIndex(
      "studentInfoTbl",
      "userId",
      userId
    );

    console.log("User data from IndexedDB:", dataArray);

    const data = Array.isArray(dataArray) ? dataArray[0] : dataArray;

    if (data != null) {
      img.src = data.userImg;
    } else {
      console.warn("No user data found for this user.");
    }
  } catch (err) {
    console.error("Failed to get user data from IndexedDB", err);
  }

  function setupUploadButton() {
    const uploadButton = document.getElementById("upload-report-button");
    if (!uploadButton) return;

    uploadButton.addEventListener("click", async function () {
      if (!navigator.onLine) {
        alert(
          "No internet connection. Please check your network and try again."
        );
        return;
      }

      const userId = localStorage.getItem("userId");
      if (!userId) {
        alert("User not authenticated. Please login again.");
        return;
      }

      if (
        !confirm("Are you sure you want to upload all reports to the server?")
      ) {
        return;
      }

      try {
        const originalIcon = uploadButton.innerHTML;
        uploadButton.innerHTML = `
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            `;
        uploadButton.disabled = true;

        const transaction = db.transaction(["reportTbl"], "readonly");
        const store = transaction.objectStore("reportTbl");
        const index = store.index("userId");
        const request = index.getAll(userId);

        request.onsuccess = async function (event) {
          const reports = event.target.result;
          if (reports.length === 0) {
            alert("No reports to upload");
            uploadButton.innerHTML = originalIcon;
            uploadButton.disabled = false;
            return;
          }

          let uploadSuccess = true;
          let errorMessage = "";

          for (const report of reports) {
            try {
              console.log(`Processing report ${report.id}`);

              const reportId = `${userId}_${report.id}`;

              const firebaseReport = {
                title: report.title,
                content: report.content,
                createdAt: report.createdAt,
                userId: userId,
                localId: report.id,
                hasImages: report.images && report.images.length > 0,
              };

              await firebaseCRUD.setDataWithId(
                "reports",
                reportId,
                firebaseReport
              );
              console.log(`Created report document with ID: ${reportId}`);

              if (report.images && report.images.length > 0) {
                console.log(
                  `Uploading ${report.images.length} images for report ${reportId}`
                );

                for (const [index, imageBlob] of report.images.entries()) {
                  try {
                    const base64String = await blobToBase64(imageBlob);
                    console.log(
                      `Uploading image ${index + 1} of ${report.images.length}`
                    );

                    await firebaseCRUD.createData(
                      `reports/${reportId}/images`,
                      {
                        imageData: base64String,
                        uploadedAt: new Date().toISOString(),
                        order: index,
                        originalName: `image_${index + 1}.jpg`,
                        reportId: reportId,
                      }
                    );

                    console.log(`Successfully uploaded image ${index + 1}`);
                  } catch (imageError) {
                    console.error(
                      `Error uploading image ${index + 1}:`,
                      imageError
                    );
                    uploadSuccess = false;
                    errorMessage = `Failed to upload some images. ${imageError.message}`;
                  }
                }
              }

              const deleteTransaction = db.transaction(
                ["reportTbl"],
                "readwrite"
              );
              const deleteStore = deleteTransaction.objectStore("reportTbl");
              deleteStore.delete(report.id);
              console.log(`Deleted local report ${report.id}`);
            } catch (reportError) {
              console.error(
                `Error processing report ${report.id}:`,
                reportError
              );
              uploadSuccess = false;
              errorMessage = `Failed to upload some reports. ${reportError.message}`;
            }
          }

          uploadButton.innerHTML = originalIcon;
          uploadButton.disabled = false;

          if (uploadSuccess) {
            alert("All reports uploaded successfully!");
          } else {
            alert(`Upload completed with some errors: ${errorMessage}`);
          }

          displayReports();
        };

        request.onerror = function (event) {
          console.error(
            "Error fetching reports from IndexedDB:",
            event.target.error
          );
          alert("Error fetching reports from local storage");
          uploadButton.innerHTML = originalIcon;
          uploadButton.disabled = false;
        };
      } catch (error) {
        console.error("Upload error:", error);
        alert("Error uploading reports: " + error.message);
        uploadButton.innerHTML = originalIcon;
        uploadButton.disabled = false;
      }
    });
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  function setupAddModal() {
    const addImageInput = document.getElementById("add-image-input");
    const addImageContainer = document.getElementById("add-image-container");
    const addReportForm = document.getElementById("add-report-form");
    let addModalImages = [];

    if (addImageInput && addImageContainer) {
      addImageInput.addEventListener("change", async function (event) {
        const files = event.target.files;

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (!file.type.match("image.*")) {
            alert(`File ${file.name} is not an image`);
            continue;
          }

          try {
            const compressedBlob = await compressImage(file, 500);

            const reader = new FileReader();
            reader.onload = function (e) {
              const container = document.createElement("div");
              container.className = "img-thumbnail-container";

              const img = document.createElement("img");
              img.src = e.target.result;
              img.className = "img-thumbnail";
              img.style.maxWidth = "80px";
              img.style.maxHeight = "80px";
              img.dataset.imageIndex = addModalImages.length;

              const deleteBtn = document.createElement("span");
              deleteBtn.className = "delete-img-btn";
              deleteBtn.innerHTML = '<i class="bi bi-x"></i>';
              deleteBtn.addEventListener("click", function (e) {
                e.stopPropagation();
                const index = parseInt(img.dataset.imageIndex);
                addModalImages.splice(index, 1);
                container.remove();
                const remainingImages =
                  addImageContainer.querySelectorAll("img");
                remainingImages.forEach((img, newIndex) => {
                  img.dataset.imageIndex = newIndex;
                });
              });

              container.appendChild(img);
              container.appendChild(deleteBtn);
              addImageContainer.appendChild(container);

              addModalImages.push(compressedBlob);
            };
            reader.readAsDataURL(compressedBlob);
          } catch (error) {
            console.error("Error compressing image:", error);
            alert(`Failed to process image ${file.name}: ${error.message}`);
          }
        }
      });
    }

    if (addReportForm) {
      addReportForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const title = document.getElementById("add-report-title").value.trim();
        const content = document
          .getElementById("add-report-content")
          .value.trim();
        const userId = localStorage.getItem("userId");

        if (!userId) {
          alert("User not authenticated. Please login again.");
          return;
        }

        if (!title || !content) {
          alert("Please fill in all required fields");
          return;
        }

        const transaction = db.transaction(["reportTbl"], "readwrite");
        const store = transaction.objectStore("reportTbl");

        const reportId = Date.now().toString();

        const reportData = {
          title,
          content,
          createdAt: new Date().toISOString(),
          reportId: reportId,
          userId: userId,
          images: addModalImages,
        };

        const request = store.add(reportData);

        request.onsuccess = function () {
          const modal = bootstrap.Modal.getInstance(
            document.getElementById("addReportModal")
          );
          if (modal) modal.hide();
          alert("Report saved successfully!");

          addReportForm.reset();
          addImageContainer.innerHTML = "";
          addModalImages = [];

          displayReports();
        };

        request.onerror = function (event) {
          console.error("Error storing report:", event.target.error);
          alert("Error saving report to local database.");
        };
      });
    }

    addImageContainer.addEventListener("click", function (e) {
      if (e.target.tagName === "IMG") {
        e.preventDefault();
        const imgSrc = e.target.src;
        const imgIndex = e.target.dataset.imageIndex;

        const viewImageModal = new bootstrap.Modal(
          document.getElementById("viewImageModal")
        );
        document.getElementById("modal-image-view").src = imgSrc;

        document.getElementById("viewImageModal").dataset.imageIndex = imgIndex;
        document.getElementById("viewImageModal").dataset.source = "add";
        viewImageModal.show();
      }
    });
  }

  function setupViewModal() {
    const viewImageContainer = document.getElementById("view-image-container");
    const updateReportForm = document.getElementById("update-report-form");
    const viewImageInput = document.getElementById("view-image-input");
    const viewReportModal = document.getElementById("viewReportModal");

    viewReportModal.addEventListener("show.bs.modal", function () {
      pendingImageChanges = { toAdd: [], toDelete: [] };
    });

    viewReportModal.addEventListener("hide.bs.modal", function () {
      pendingImageChanges = { toAdd: [], toDelete: [] };
    });

    if (viewImageInput) {
      viewImageInput.addEventListener("change", async function (event) {
        if (!currentReportId) return;

        const files = event.target.files;

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (!file.type.match("image.*")) {
            alert(`File ${file.name} is not an image`);
            continue;
          }

          try {
            const compressedBlob = await compressImage(file, 500);
            pendingImageChanges.toAdd.push(compressedBlob);
          } catch (error) {
            console.error("Error compressing image:", error);
            alert(`Failed to process image ${file.name}: ${error.message}`);
          }
        }

        refreshViewModalImages(currentReportId, true);
      });
    }

    viewImageContainer.addEventListener("click", function (e) {
      if (e.target.tagName === "IMG") {
        e.preventDefault();
        const container = e.target.closest(".img-thumbnail-container");
        if (!container) return;

        const imgIndex = parseInt(e.target.dataset.imageIndex);
        const isPendingAddition = e.target.dataset.pending === "true";

        const viewImageModal = new bootstrap.Modal(
          document.getElementById("viewImageModal")
        );
        document.getElementById("modal-image-view").src = e.target.src;

        document.getElementById("viewImageModal").dataset.imageIndex = imgIndex;
        document.getElementById("viewImageModal").dataset.isPending =
          isPendingAddition;
        document.getElementById("viewImageModal").dataset.reportId =
          currentReportId;
        viewImageModal.show();
      }
    });

    if (updateReportForm) {
      updateReportForm.addEventListener("submit", function (e) {
        e.preventDefault();

        if (!currentReportId) return;

        const title = document.getElementById("view-report-title").value.trim();
        const content = document.getElementById("report-content").value.trim();
        const userId = localStorage.getItem("userId");

        if (!userId) {
          alert("User not authenticated. Please login again.");
          return;
        }

        if (!title || !content) {
          alert("Please fill in all required fields");
          return;
        }

        const transaction = db.transaction(["reportTbl"], "readwrite");
        const store = transaction.objectStore("reportTbl");
        const getRequest = store.get(parseInt(currentReportId));

        getRequest.onsuccess = function () {
          const report = getRequest.result;

          if (report.userId !== userId) {
            alert("You are not authorized to edit this report");
            return;
          }

          report.title = title;
          report.content = content;

          if (!report.images) report.images = [];

          pendingImageChanges.toDelete.sort((a, b) => b - a);
          pendingImageChanges.toDelete.forEach((index) => {
            report.images.splice(index, 1);
          });

          pendingImageChanges.toAdd.forEach((file) => {
            report.images.push(file);
          });

          const putRequest = store.put(report);
          putRequest.onsuccess = function () {
            alert("Report updated successfully!");
            displayReports();

            pendingImageChanges = { toAdd: [], toDelete: [] };

            const modal = bootstrap.Modal.getInstance(
              document.getElementById("viewReportModal")
            );
            if (modal) modal.hide();
          };
        };
      });
    }

    document.addEventListener("click", function (e) {
      if (e.target.classList.contains("delete-btn")) {
        e.preventDefault();
        if (!currentReportId) return;

        const userId = localStorage.getItem("userId");
        if (!userId) {
          alert("User not authenticated. Please login again.");
          return;
        }

        const deleteModal = new bootstrap.Modal(
          document.getElementById("deleteConfirmationModal")
        );
        deleteModal.show();

        document.querySelector(
          '#deleteConfirmationModal [name="delete-yes"]'
        ).onclick = function () {
          const transaction = db.transaction(["reportTbl"], "readwrite");
          const store = transaction.objectStore("reportTbl");
          const getRequest = store.get(parseInt(currentReportId));

          getRequest.onsuccess = function () {
            const report = getRequest.result;
            if (report.userId !== userId) {
              alert("You are not authorized to delete this report");
              deleteModal.hide();
              return;
            }

            const deleteRequest = store.delete(parseInt(currentReportId));
            deleteRequest.onsuccess = function () {
              displayReports();
              deleteModal.hide();

              const viewModal = bootstrap.Modal.getInstance(
                document.getElementById("viewReportModal")
              );
              if (viewModal) viewModal.hide();
            };
          };
        };
      }
    });
  }

  function refreshViewModalImages(reportId, showPending = false) {
    const viewImageContainer = document.getElementById("view-image-container");
    viewImageContainer.innerHTML = "";

    const transaction = db.transaction(["reportTbl"], "readonly");
    const store = transaction.objectStore("reportTbl");
    const getRequest = store.get(parseInt(reportId));

    getRequest.onsuccess = function () {
      const report = getRequest.result;
      if (!report) return;

      if (report.images) {
        report.images.forEach((blob, index) => {
          if (!pendingImageChanges.toDelete.includes(index)) {
            const container = document.createElement("div");
            container.className = "img-thumbnail-container";

            const img = document.createElement("img");
            img.src = URL.createObjectURL(blob);
            img.className = "img-thumbnail";
            img.style.maxWidth = "80px";
            img.style.maxHeight = "80px";
            img.dataset.imageIndex = index;
            img.dataset.pending = "false";

            const deleteBtn = document.createElement("span");
            deleteBtn.className = "delete-img-btn";
            deleteBtn.innerHTML = '<i class="bi bi-x"></i>';
            deleteBtn.addEventListener("click", function (e) {
              e.stopPropagation();
              pendingImageChanges.toDelete.push(index);
              refreshViewModalImages(reportId, showPending);
            });

            container.appendChild(img);
            container.appendChild(deleteBtn);
            viewImageContainer.appendChild(container);
          }
        });
      }

      if (showPending && pendingImageChanges.toAdd.length > 0) {
        pendingImageChanges.toAdd.forEach((file, index) => {
          const reader = new FileReader();
          reader.onload = function (e) {
            const container = document.createElement("div");
            container.className = "img-thumbnail-container";

            const img = document.createElement("img");
            img.src = e.target.result;
            img.className = "img-thumbnail";
            img.style.maxWidth = "80px";
            img.style.maxHeight = "80px";
            img.dataset.imageIndex = index;
            img.dataset.pending = "true";

            const deleteBtn = document.createElement("span");
            deleteBtn.className = "delete-img-btn";
            deleteBtn.innerHTML = '<i class="bi bi-x"></i>';
            deleteBtn.addEventListener("click", function (e) {
              e.stopPropagation();
              pendingImageChanges.toAdd.splice(index, 1);
              refreshViewModalImages(reportId, showPending);
            });

            container.appendChild(img);
            container.appendChild(deleteBtn);
            viewImageContainer.appendChild(container);
          };
          reader.readAsDataURL(file);
        });
      }
    };
  }

  document
    .querySelector("#viewImageModal .bi-x-lg")
    .addEventListener("click", function () {
      bootstrap.Modal.getInstance(
        document.getElementById("viewImageModal")
      ).hide();
    });

  function loadReportDetails(reportId) {
    const transaction = db.transaction(["reportTbl"], "readonly");
    const store = transaction.objectStore("reportTbl");
    const request = store.get(reportId);

    request.onsuccess = function (event) {
      const report = event.target.result;
      if (report) {
        currentReportId = report.id;

        const viewModal = document.getElementById("viewReportModal");
        viewModal.querySelector("#view-report-title").value = report.title;
        viewModal.querySelector("#report-content").value = report.content;

        viewModal.querySelector("#update-report-form").dataset.reportId =
          reportId;

        refreshViewModalImages(reportId);
      }
    };
  }
  function displayReports() {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.error("User not authenticated");
      return;
    }

    const transaction = db.transaction(["reportTbl"], "readonly");
    const store = transaction.objectStore("reportTbl");
    const index = store.index("userId");
    const request = index.getAll(userId);

    request.onsuccess = function (event) {
      const reports = event.target.result;
      const cardContainer = document.querySelector(".card-container");

      if (reports.length > 0) {
        cardContainer.innerHTML = "";

        reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        reports.forEach((report) => {
          const date = new Date(report.createdAt);
          const formattedDate = date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });

          const card = document.createElement("a");
          card.href = "#";
          card.className = "report-card mb-2";
          card.setAttribute("data-bs-toggle", "modal");
          card.setAttribute("data-bs-target", "#viewReportModal");
          card.setAttribute("data-report-id", report.id);

          card.innerHTML = `
            <span id="title" class="text-truncate" style="width: calc(100% - 10px);">${report.title}</span>
            <span id="separator"></span>
            <div class="report-content-container">
                <p class="text-truncate m-0" style="width: calc(100% - 40px);">${report.content}</p>
                <p id="date" class="text-end mt-2">${formattedDate}</p>
            </div>
          `;

          card.addEventListener("click", function () {
            loadReportDetails(report.id);
          });

          cardContainer.appendChild(card);
        });
      } else {
        cardContainer.innerHTML = `
            <div class="position-absolute top-50 start-50 translate-middle align-items-center col-12 text-center py-4">
                <i class="bi bi-exclamation-circle fs-1 text-muted"></i>
                <h6 class="mt-2">No Reports Found</h6>
                <p class="mt-1">Offline reports that have not been sent to the server will be displayed here.</p>
            </div>
        `;
      }
    };
  }

  function setupDateSearch() {
    const dateInput = document.getElementById("report-search-input");
    if (dateInput) {
      dateInput.addEventListener("change", function (e) {
        filterReportsByDate(e.target.value);
      });
    }
  }

  function filterReportsByDate(selectedDate) {
    if (!db) {
      console.error("Database not initialized");
      return;
    }

    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.error("User not authenticated");
      return;
    }

    const transaction = db.transaction(["reportTbl"], "readonly");
    const store = transaction.objectStore("reportTbl");

    const userIndex = store.index("userId");
    const userRequest = userIndex.getAll(userId);

    userRequest.onsuccess = function (event) {
      const userReports = event.target.result;
      const cardContainer = document.querySelector(".card-container");

      if (!selectedDate) {
        displayReports();
        return;
      }

      const filteredReports = userReports.filter((report) => {
        const reportDate = new Date(report.createdAt);
        const searchDate = new Date(selectedDate);

        return (
          reportDate.getFullYear() === searchDate.getFullYear() &&
          reportDate.getMonth() === searchDate.getMonth() &&
          reportDate.getDate() === searchDate.getDate()
        );
      });

      if (filteredReports.length > 0) {
        cardContainer.innerHTML = "";
        filteredReports.forEach((report) => {
          const date = new Date(report.createdAt);
          const formattedDate = date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });

          const card = document.createElement("a");
          card.href = "#";
          card.className = "report-card mb-2";
          card.setAttribute("data-bs-toggle", "modal");
          card.setAttribute("data-bs-target", "#viewReportModal");
          card.setAttribute("data-report-id", report.id);

          card.innerHTML = `
          <span id="title" class="text-truncate" style="width: calc(100% - 10px);">${report.title}</span>
          <span id="separator"></span>
          <div class="report-content-container">
            <p class="text-truncate m-0" style="width: calc(100% - 40px);">${report.content}</p>
            <p id="date" class="text-end mt-2">${formattedDate}</p>
          </div>
        `;

          card.addEventListener("click", function () {
            loadReportDetails(report.id);
          });

          cardContainer.appendChild(card);
        });
      } else {
        cardContainer.innerHTML = `
            <div class="position-absolute top-50 start-50 translate-middle align-items-center col-12 text-center py-4">
                <i class="bi bi-exclamation-circle fs-1 text-muted"></i>
                <h6 class="mt-2">No Reports Found For This Date</h6>
                <p class="mt-1">Please choose a different date or create a new report.</p>
            </div>
        `;
      }
    };

    userRequest.onerror = function (event) {
      console.error("Error fetching user reports:", event.target.error);
    };
  }
});

function compressImage(file, maxSizeKB = 200, quality = 0.7) {
  return new Promise((resolve, reject) => {
    if (!file.type.match("image.*")) {
      reject(new Error("File is not an image"));
      return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const MAX_WIDTH = 512;
        const MAX_HEIGHT = 512;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        let qualityAdjusted = quality;
        let blob;

        const attemptCompression = () => {
          canvas.toBlob(
            (resultBlob) => {
              if (!resultBlob) {
                reject(new Error("Failed to compress image"));
                return;
              }

              if (
                resultBlob.size / 512 <= maxSizeKB ||
                qualityAdjusted <= 0.1
              ) {
                resolve(resultBlob);
              } else {
                qualityAdjusted = Math.max(0.1, qualityAdjusted - 0.1);
                canvas.toBlob(
                  (newBlob) => {
                    blob = newBlob;
                    attemptCompression();
                  },
                  file.type,
                  qualityAdjusted
                );
              }
            },
            file.type,
            qualityAdjusted
          );
        };

        attemptCompression();
      };
      img.onerror = reject;
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
