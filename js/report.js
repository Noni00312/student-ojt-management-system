document.addEventListener("DOMContentLoaded", function () {
  // Initialize IndexedDB
  let db;
  const request = indexedDB.open("ReportsDB", 1);
  let currentReportId = null; // Moved to global scope

  request.onupgradeneeded = function (event) {
    db = event.target.result;
    if (!db.objectStoreNames.contains("reports")) {
      const store = db.createObjectStore("reports", {
        keyPath: "id",
        autoIncrement: true,
      });
      store.createIndex("date", "date", { unique: false });
    }
  };

  request.onsuccess = function (event) {
    db = event.target.result;
    displayReports();
    setupAddModal();
    setupViewModal();
  };

  request.onerror = function (event) {
    console.error("IndexedDB error:", event.target.error);
  };

  // ========================
  // ADD REPORT MODAL FUNCTIONS
  // ========================
  function setupAddModal() {
    const addImageInput = document.getElementById("add-image-input");
    const addImageContainer = document.getElementById("add-image-container");
    const addReportForm = document.getElementById("add-report-form");
    let addModalImages = []; // Store images for add modal

    // Handle image selection and preview for add modal
    if (addImageInput && addImageContainer) {
      addImageInput.addEventListener("change", function (event) {
        const files = event.target.files;

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (!file.type.match("image.*")) {
            alert(`File ${file.name} is not an image`);
            continue;
          }
          if (file.size > 2000000) {
            alert(`File ${file.name} is too large`);
            continue;
          }

          const reader = new FileReader();
          reader.onload = function (e) {
            const img = document.createElement("img");
            img.src = e.target.result;
            img.className = "img-thumbnail me-2 mb-2";
            img.style.maxWidth = "80px";
            img.style.maxHeight = "80px";
            img.dataset.imageIndex = addModalImages.length;
            addImageContainer.appendChild(img);

            // Add to our temporary storage
            addModalImages.push(file);
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Handle form submission for add modal
    if (addReportForm) {
      addReportForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const title = document.getElementById("add-report-title").value.trim();
        const content = document
          .getElementById("add-report-content")
          .value.trim();

        if (!title || !content) {
          alert("Please fill in all required fields");
          return;
        }

        const transaction = db.transaction(["reports"], "readwrite");
        const store = transaction.objectStore("reports");

        const reportData = {
          title,
          content,
          date: new Date().toISOString(),
          images: addModalImages, // Use our stored images
        };

        const request = store.add(reportData);

        request.onsuccess = function () {
          const modal = bootstrap.Modal.getInstance(
            document.getElementById("addReportModal")
          );
          if (modal) modal.hide();
          alert("Report saved successfully!");

          // Reset form and clear images
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

    // Handle image click in add modal
    addImageContainer.addEventListener("click", function (e) {
      if (e.target.tagName === "IMG") {
        e.preventDefault();
        const imgSrc = e.target.src;
        const imgIndex = e.target.dataset.imageIndex;

        // Set up the image view modal
        const viewImageModal = new bootstrap.Modal(
          document.getElementById("viewImageModal")
        );
        document.getElementById("modal-image-view").src = imgSrc;

        // Store the index and mark it as from add modal
        document.getElementById("viewImageModal").dataset.imageIndex = imgIndex;
        document.getElementById("viewImageModal").dataset.source = "add";
        viewImageModal.show();
      }
    });
  }

  // ========================
  // VIEW/UPDATE REPORT MODAL FUNCTIONS
  // ========================
  function setupViewModal() {
    const viewImageContainer = document.getElementById("view-image-container");
    const updateReportForm = document.getElementById("update-report-form");
    const viewImageInput = document.getElementById("view-image-input");

    // Handle image selection for update modal
    if (viewImageInput) {
      viewImageInput.addEventListener("change", function (event) {
        if (!currentReportId) return;

        const files = event.target.files;
        const transaction = db.transaction(["reports"], "readwrite");
        const store = transaction.objectStore("reports");
        const getRequest = store.get(parseInt(currentReportId));

        getRequest.onsuccess = function () {
          const report = getRequest.result;
          if (!report.images) report.images = [];

          // Process new files
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file.type.match("image.*")) {
              alert(`File ${file.name} is not an image`);
              continue;
            }
            if (file.size > 2000000) {
              alert(`File ${file.name} is too large`);
              continue;
            }
            report.images.push(file);
          }

          // Update the report
          const putRequest = store.put(report);
          putRequest.onsuccess = function () {
            loadReportDetails(currentReportId);
          };
        };
      });
    }

    // Handle image click in view modal
    viewImageContainer.addEventListener("click", function (e) {
      if (e.target.tagName === "IMG") {
        e.preventDefault();
        const imgSrc = e.target.src;
        const imgIndex = e.target.dataset.imageIndex;

        // Set up the image view modal
        const viewImageModal = new bootstrap.Modal(
          document.getElementById("viewImageModal")
        );
        document.getElementById("modal-image-view").src = imgSrc;

        // Store the index and mark it as from view modal
        document.getElementById("viewImageModal").dataset.imageIndex = imgIndex;
        document.getElementById("viewImageModal").dataset.source = "view";
        document.getElementById("viewImageModal").dataset.reportId =
          currentReportId;
        viewImageModal.show();
      }
    });

    // Handle update form submission
    if (updateReportForm) {
      updateReportForm.addEventListener("submit", function (e) {
        e.preventDefault();

        if (!currentReportId) return;

        const title = document.getElementById("view-report-title").value.trim();
        const content = document.getElementById("report-content").value.trim();

        if (!title || !content) {
          alert("Please fill in all required fields");
          return;
        }

        const transaction = db.transaction(["reports"], "readwrite");
        const store = transaction.objectStore("reports");
        const getRequest = store.get(parseInt(currentReportId));

        getRequest.onsuccess = function () {
          const report = getRequest.result;
          report.title = title;
          report.content = content;

          const putRequest = store.put(report);
          putRequest.onsuccess = function () {
            alert("Report updated successfully!");
            displayReports();

            // Close the modal
            const modal = bootstrap.Modal.getInstance(
              document.getElementById("viewReportModal")
            );
            if (modal) modal.hide();
          };
        };
      });
    }

    // Handle delete report button - Fixed event delegation
    document.addEventListener("click", function (e) {
      if (e.target.classList.contains("delete-btn")) {
        e.preventDefault();
        if (!currentReportId) return;

        const deleteModal = new bootstrap.Modal(
          document.getElementById("deleteConfirmationModal")
        );
        deleteModal.show();

        document.querySelector(
          '#deleteConfirmationModal [name="delete-yes"]'
        ).onclick = function () {
          const transaction = db.transaction(["reports"], "readwrite");
          const store = transaction.objectStore("reports");
          const deleteRequest = store.delete(parseInt(currentReportId));

          deleteRequest.onsuccess = function () {
            displayReports();
            deleteModal.hide();

            // Also close the view modal
            const viewModal = bootstrap.Modal.getInstance(
              document.getElementById("viewReportModal")
            );
            if (viewModal) viewModal.hide();
          };
        };
      }
    });
  }

  // ========================
  // IMAGE VIEW MODAL FUNCTIONS
  // ========================
  document
    .getElementById("delete-image-btn")
    .addEventListener("click", function () {
      const imageIndex = parseInt(
        document.getElementById("viewImageModal").dataset.imageIndex
      );
      const source = document.getElementById("viewImageModal").dataset.source;
      const reportId =
        document.getElementById("viewImageModal").dataset.reportId;

      if (source === "add") {
        // Handle deletion from add modal
        const addImageContainer = document.getElementById(
          "add-image-container"
        );
        const addImageInput = document.getElementById("add-image-input");

        if (imageIndex >= 0 && addImageContainer.children.length > imageIndex) {
          // Remove the image preview
          addImageContainer.removeChild(addImageContainer.children[imageIndex]);

          // Update the file input
          const files = Array.from(addImageInput.files);
          files.splice(imageIndex, 1);

          const dataTransfer = new DataTransfer();
          files.forEach((file) => dataTransfer.items.add(file));
          addImageInput.files = dataTransfer.files;
        }
      } else if (source === "view" && reportId) {
        // Handle deletion from view modal
        const transaction = db.transaction(["reports"], "readwrite");
        const store = transaction.objectStore("reports");
        const getRequest = store.get(parseInt(reportId));

        getRequest.onsuccess = function () {
          const report = getRequest.result;
          if (report.images && report.images.length > imageIndex) {
            report.images.splice(imageIndex, 1);

            const putRequest = store.put(report);
            putRequest.onsuccess = function () {
              // Refresh the view
              loadReportDetails(reportId);
            };
          }
        };
      }

      // Close the modal
      bootstrap.Modal.getInstance(
        document.getElementById("viewImageModal")
      ).hide();
    });

  // Close the image modal when clicking the X
  document
    .querySelector("#viewImageModal .bi-x-lg")
    .addEventListener("click", function () {
      bootstrap.Modal.getInstance(
        document.getElementById("viewImageModal")
      ).hide();
    });

  // ========================
  // HELPER FUNCTIONS
  // ========================
  function loadReportDetails(reportId) {
    const transaction = db.transaction(["reports"], "readonly");
    const store = transaction.objectStore("reports");
    const request = store.get(reportId);

    request.onsuccess = function (event) {
      const report = event.target.result;
      if (report) {
        currentReportId = report.id; // Update the current report ID

        const viewModal = document.getElementById("viewReportModal");
        viewModal.querySelector("#view-report-title").value = report.title;
        viewModal.querySelector("#report-content").value = report.content;

        // Set the report ID as a data attribute on the form
        viewModal.querySelector("#update-report-form").dataset.reportId =
          reportId;

        // Display images if any
        const imageContainer = viewModal.querySelector("#view-image-container");
        imageContainer.innerHTML = "";
        if (report.images && report.images.length > 0) {
          report.images.forEach((blob, index) => {
            const img = document.createElement("img");
            img.src = URL.createObjectURL(blob);
            img.className = "img-thumbnail me-2 mb-2";
            img.style.maxWidth = "80px";
            img.style.maxHeight = "80px";
            img.dataset.imageIndex = index;
            imageContainer.appendChild(img);
          });
        }
      }
    };
  }

  function displayReports() {
    const transaction = db.transaction(["reports"], "readonly");
    const store = transaction.objectStore("reports");
    const request = store.getAll();

    request.onsuccess = function (event) {
      const reports = event.target.result;
      const cardContainer = document.querySelector(".card-container");

      if (reports.length > 0) {
        cardContainer.innerHTML = "";

        reports.forEach((report) => {
          const date = new Date(report.date);
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
        cardContainer.innerHTML = "<p>No reports found</p>";
      }
    };
  }
});
