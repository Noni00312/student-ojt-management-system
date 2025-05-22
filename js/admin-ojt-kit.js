document.addEventListener("DOMContentLoaded", async function () {
  try {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      console.error("No userId found in localStorage");
      return;
    }

    await window.dbReady;

    const img = document.getElementById("user-profile");
    if (!img) {
      console.error("User image element not found in DOM");
      return;
    }

    img.src = "../assets/img/icons8_male_user_480px_1.png";
    img.alt = "Default user profile";

    const dataArray = await crudOperations.getByIndex(
      "studentInfoTbl",
      "userId",
      userId
    );

    const data = Array.isArray(dataArray) ? dataArray[0] : dataArray;

    if (data && data.userImg) {
      img.src = data.userImg;
      img.alt = "User profile image";
    } else {
      console.warn("No user image found in data, using default");
    }
  } catch (err) {
    console.error("Failed to get user data from IndexedDB", err);
    const img = document.getElementById("user-profile");
    if (img) {
      img.src = "../assets/img/icons8_male_user_480px_1.png";
      img.alt = "Default user profile (error)";
    }
  }
});

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
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

function loadStudents() {
  showLoading(true);
  import("./firebase-crud.js")
    .then(({ firebaseCRUD }) => {
      firebaseCRUD
        .queryData("students", "userType", "==", "student")
        .then((students) => {
          firebaseCRUD
            .queryData("students", "userType", "==", "studentAssistant")
            .then((assistants) => {
              showLoading(false);

              const allUsers = [...students, ...assistants];
              displayStudents(allUsers);
            })
            .catch((error) => {
              showLoading(false);
              console.error("Error loading assistants:", error);
              showError("Failed to load student assistants: " + error.message);
            });
        })
        .catch((error) => {
          showLoading(false);
          console.error("Error loading students:", error);
          showError("Failed to load students: " + error.message);
        });
    })
    .catch((err) => {
      showLoading(false);
      console.error("Failed to load firebase-crud:", err);
      showError("Failed to load required modules. Please try again.");
    });
}
let globalStudentName = "";
function showOjtKitsModal() {
  showLoading(true);

  import("./firebase-crud.js")
    .then(({ firebaseCRUD }) => {
      return firebaseCRUD.getAllData("ojtKits");
    })
    .then((ojtKits) => {
      const modal = document.getElementById("documentsModal");
      const optionsContainer = document.querySelector(
        "#documentsModal .d-flex.flex-column.gap-3"
      );

      document.getElementById("documentsModalLabel").textContent = "OJT Kits";
      optionsContainer.innerHTML = "";

      if (ojtKits && ojtKits.length > 0) {
        ojtKits.forEach((kit) => {
          const container = document.createElement("div");
          container.className =
            "d-flex align-items-center justify-content-between";

          container.innerHTML = `
                        <button class="document-option-btn d-flex align-items-center p-3 flex-grow-1" data-ojt-kit-id="${
                          kit.id
                        }">
                            <div class="icon-container bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px;">
                                <i class="bi bi-file-earmark-text-fill text-white"></i>
                            </div>
                            <span class="text-white">${
                              kit.title || "Untitled Kit"
                            }</span>
                        </button>
                        <div class="d-flex ms-2">
                            <button class="btn btn-sm btn-outline-warning me-2 edit-kit" data-kit-id="${
                              kit.id
                            }">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger delete-kit" data-kit-id="${
                              kit.id
                            }">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    `;

          container
            .querySelector(".document-option-btn")
            .addEventListener("click", function () {
              const kitId = this.getAttribute("data-ojt-kit-id");
              handleOjtKitSelection(null, kitId);
            });

          container
            .querySelector(".edit-kit")
            .addEventListener("click", (e) => {
              e.stopPropagation();
              loadOjtKitForEdit(kit.id);
            });

          container
            .querySelector(".delete-kit")
            .addEventListener("click", (e) => {
              e.stopPropagation();
              deleteOjtKit(kit.id);
            });

          optionsContainer.appendChild(container);
        });
      } else {
        optionsContainer.innerHTML = `
                    <div class="text-center text-white py-3">
                        <i class="bi bi-exclamation-circle fs-4"></i>
                        <p class="mt-2">No OJT Kits available</p>
                    </div>
                `;
      }

      new bootstrap.Modal(modal).show();
      showLoading(false);
    })
    .catch((error) => {
      console.error("Error loading OJT Kits:", error);
      Swal.fire({
        icon: "error",
        title: "Something When Wrong",
        text: "Failed to load OJT Kits.",
        confirmButtonColor: "#590f1c",
      });
      showLoading(false);
    });
}

document
  .getElementById("floatingActionBtn")
  .addEventListener("click", showOjtKitsModal);

async function displayStudents(students) {
  const cardContainer = document.querySelector(".card-container .row");
  cardContainer.innerHTML = "";

  if (!students || students.length === 0) {
    cardContainer.innerHTML = `
            <div class="position-absolute top-50 start-50 translate-middle col-12 text-center py-4">
                <i class="bi bi-exclamation-circle fs-1 text-muted"></i>
                <h6 class="mt-2">No Students Available</h6>
                <p class="mt-1">No students have been registered yet.</p>
            </div>
        `;
    return;
  }

  const { firebaseCRUD } = await import("./firebase-crud.js");
  const allKits = await firebaseCRUD.getAllData("ojtKits");
  const totalKitsCount = allKits?.length || 0;

  for (const student of students) {
    const colDiv = document.createElement("div");
    colDiv.className = "col-lg-4 col-md-6 px-2";

    const studentReports = await firebaseCRUD.queryData(
      "ojtkits_2",
      "userId",
      "==",
      student.userId
    );
    const submittedKitsCount = studentReports?.length || 0;
    const isComplete =
      submittedKitsCount === totalKitsCount && totalKitsCount > 0;
    const completionStatus =
      totalKitsCount > 0
        ? `${submittedKitsCount}/${totalKitsCount} Kits Completed`
        : "No Kits Available";

    colDiv.innerHTML = `
            <div class="student-card h-100 ${
              isComplete ? "completed-card" : ""
            }" data-student-id="${student.userId}">
                <div class="d-flex align-items-center text-decoration-none h-100">
                    <div class="img-container me-3 flex-shrink-0">
                        ${
                          student.userImg
                            ? `<img src="${student.userImg}" alt="${student.firstName}">`
                            : `<img src="../assets/img/icons8_male_user_480px_1.png" alt="Default user">`
                        }
                    </div>
                    <div class="main-container w-100 overflow-hidden">
                        <div class="name-id-container d-flex justify-content-between">
                            <p class="m-0 text-truncate fw-bold text-white">${
                              student.firstName +
                                " " +
                                (student.middleName
                                  ? student.middleName + " "
                                  : "") +
                                student.lastName +
                                (student.suffix ? " " + student.suffix : "") ||
                              "No name"
                            }</p>
                            <p class="m-0 ms-2 text-nowrap text-white">${
                              student.studentId || "No ID"
                            }</p>
                            <p class="d-none">${student.userId || ""}</p>
                        </div>
                        <div class="separator my-2"></div>
                        <div class="completion-status">
                            <p class="m-0 text-truncate text-white">
                                ${completionStatus}
                                ${isComplete ? "✓" : ""}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;

    const card = colDiv.querySelector(".student-card");
    card.addEventListener("click", function () {
      const studentId = this.getAttribute("data-student-id");
      const studentName = this.querySelector(
        ".name-id-container p:first-child"
      ).textContent;
      globalStudentName = studentName;
      const studentNumber = this.querySelector(
        ".name-id-container p:nth-child(2)"
      ).textContent;

      showStudentDocumentsModal(studentId, studentName, studentNumber);
    });

    cardContainer.appendChild(colDiv);
  }
}

function showDocumentsModal(studentId) {
  showLoading(true);

  import("./firebase-crud.js")
    .then(({ firebaseCRUD }) => {
      return firebaseCRUD
        .queryData("students", "userId", "==", studentId)
        .then((students) => {
          if (!students || students.length === 0) {
            throw new Error("Student not found");
          }

          const student = students[0];

          const modalTitle = document.getElementById("documentsModalLabel");
          modalTitle.textContent = `Documents for ${student.firstName} ${student.lastName}`;

          const modal = document.getElementById("documentsModal");
          modal.setAttribute("data-student-id", studentId);

          return firebaseCRUD.getAllData("ojtKits");
        });
    })

    .then((ojtKits) => {
      const optionsContainer = document.querySelector(
        "#documentsModal .d-flex.flex-column.gap-3"
      );
      optionsContainer.innerHTML = "";

      if (ojtKits && ojtKits.length > 0) {
        ojtKits.forEach((kit) => {
          const container = document.createElement("div");
          container.className =
            "d-flex align-items-center justify-content-between";

          const button = document.createElement("button");
          button.className =
            "document-option-btn d-flex align-items-center p-3 flex-grow-1";
          button.setAttribute("data-ojt-kit-id", kit.id);

          button.innerHTML = `
                        <div class="icon-container bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px;">
                            <i class="bi bi-file-earmark-text-fill text-white"></i>
                        </div>
                        <span class="text-white">${
                          kit.title || "Untitled Kit"
                        }</span>
                    `;

          button.addEventListener("click", function () {
            const kitId = this.getAttribute("data-ojt-kit-id");
            const studentId = document
              .getElementById("documentsModal")
              .getAttribute("data-student-id");
            handleOjtKitSelection(studentId, kitId);
          });

          const actionButtons = document.createElement("div");
          actionButtons.className = "d-flex ms-2";

          const editBtn = document.createElement("button");
          editBtn.className = "btn btn-sm btn-outline-warning me-2";
          editBtn.innerHTML = '<i class="bi bi-pencil"></i>';
          editBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            loadOjtKitForEdit(kit.id);
          });

          const deleteBtn = document.createElement("button");
          deleteBtn.className = "btn btn-sm btn-outline-danger";
          deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
          deleteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            deleteOjtKit(kit.id);
          });

          actionButtons.appendChild(editBtn);
          actionButtons.appendChild(deleteBtn);

          container.appendChild(button);
          container.appendChild(actionButtons);
          optionsContainer.appendChild(container);
        });
      } else {
        optionsContainer.innerHTML = `
                    <div class="text-center text-white py-3">
                        <i class="bi bi-exclamation-circle fs-4"></i>
                        <p class="mt-2">No OJT Kits available</p>
                    </div>
                `;
      }

      const bsModal = new bootstrap.Modal(
        document.getElementById("documentsModal")
      );
      bsModal.show();

      showLoading(false);
    })
    .catch((error) => {
      console.error("Error loading documents:", error);
      showLoading(false);
    });
}

document
  .getElementById("update-report-form")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const title = document.getElementById("update-report-title").value.trim();
    const content = document
      .getElementById("update-report-content")
      .value.trim();

    if (!title || !content) {
      Swal.fire({
        icon: "warning",
        title: "All Fields Are Required",
        text: "Please fill in all required fields.",
        confirmButtonColor: "#590f1c",
      });

      return;
    }

    if (!currentEditingKitId) {
      Swal.fire({
        icon: "error",
        title: "Select OJT Kit First",
        text: "No OJT Kit selected for editing.",
        confirmButtonColor: "#590f1c",
      });
      return;
    }

    const submitButton = document.getElementById("update-report-button");
    const originalButtonText = submitButton.innerHTML;
    submitButton.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Updating...';
    submitButton.disabled = true;

    import("./firebase-crud.js")
      .then(({ firebaseCRUD }) => {
        return firebaseCRUD.updateData("ojtKits", currentEditingKitId, {
          title: title,
          content: content,
          lastUpdated: new Date().toISOString(),
        });
      })
      .then(() => {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "OJT Kit updated successfully!",
          timer: 2000,
          showConfirmButton: false,
        });

        const editModal = bootstrap.Modal.getInstance(
          document.getElementById("addOJTKITSModalEdit")
        );
        editModal.hide();

        const docsModal = document.getElementById("documentsModal");
        if (docsModal.getAttribute("data-student-id")) {
          const studentId = docsModal.getAttribute("data-student-id");
          showDocumentsModal(studentId);
        }

        this.reset();
        currentEditingKitId = null;
        loadStudents();
      })
      .catch((error) => {
        console.error("Error updating OJT Kit:", error);
        Swal.fire({
          icon: "error",
          title: "An Error Occur",
          text: `Error: ${error.message}`,
          confirmButtonColor: "#590f1c",
        });
      })
      .finally(() => {
        submitButton.innerHTML = originalButtonText;
        submitButton.disabled = false;
      });
  });

function loadOjtKitForEdit(kitId) {
  showLoading(true);

  import("./firebase-crud.js")
    .then(({ firebaseCRUD }) => {
      return firebaseCRUD.getDataById("ojtKits", kitId);
    })
    .then((kit) => {
      const docsModal = bootstrap.Modal.getInstance(
        document.getElementById("documentsModal")
      );
      if (docsModal) {
        docsModal.hide();
      }

      document.getElementById("update-report-title").value = kit.title || "";
      document.getElementById("update-report-content").value =
        kit.content || "";

      currentEditingKitId = kit.id;

      const editModal = new bootstrap.Modal(
        document.getElementById("addOJTKITSModalEdit")
      );
      editModal.show();

      showLoading(false);
    })
    .catch((error) => {
      console.error("Error loading kit for edit:", error);
      Swal.fire({
        icon: "error",
        title: "Something Went Wrong",
        text: "Failed to load OJT Kit for editing.",
        confirmButtonColor: "#590f1c",
      });

      showLoading(false);
    });
}

document
  .getElementById("addOJTKITSModalEdit")
  .addEventListener("hidden.bs.modal", function () {
    currentEditingKitId = null;
    document.getElementById("update-report-form").reset();
  });

async function deleteOjtKit(kitId) {
  const result = await Swal.fire({
    title: "Are you sure?",
    text: "Are you sure you want to delete this OJT Kit?",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#590f1c",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Delete",
    cancelButtonText: "Cancel",
  });

  if (!result.isConfirmed) return;

  showLoading(true);

  import("./firebase-crud.js")
    .then(async ({ firebaseCRUD }) => {
      const canDelete = await firebaseCRUD.queryData(
        "ojtkits_2",
        "ojtKitId",
        "==",
        kitId
      );

      if (canDelete.length === 0) {
        await firebaseCRUD.deleteData("ojtKits", kitId);
        return true;
      } else {
        throw new Error("There are related entries in the database.");
      }
    })
    .then((deleted) => {
      if (deleted) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "OJT Kit deleted successfully.",
          timer: 2000,
          showConfirmButton: false,
        });

        const docsModal = bootstrap.Modal.getInstance(
          document.getElementById("documentsModal")
        );
        if (docsModal) {
          docsModal.hide();
          loadStudents();
        }
      }
    })
    .catch((error) => {
      console.error("Error deleting kit:", error.message);
      Swal.fire({
        icon: "error",
        title: "Delete Failed",
        text: error.message || "Failed to delete OJT Kit.",
        confirmButtonColor: "#590f1c",
      });
    })
    .finally(() => {
      showLoading(false);
    });
}

async function handleOjtKitSelection(studentId, kitId) {
  try {
    showLoading(true);

    const viewModal = document.getElementById("viewReportModal");
    const imageContainer = document.getElementById("report-images-container");
    const DLContainer = document.getElementById("download-button-container");
    imageContainer.innerHTML = "";
    DLContainer.innerHTML = "";

    const [{ firebaseCRUD }] = await Promise.all([
      import("./firebase-crud.js"),
    ]);

    const kit = await firebaseCRUD.getDataById("ojtKits", kitId);
    if (!kit) throw new Error("OJT Kit not found");

    const studentSubmissions = await firebaseCRUD.queryData(
      "ojtkits_2",
      "ojtKitId",
      "==",
      kitId
    );
    const studentSubmission = studentSubmissions.find(
      (report) => report.userId === studentId
    );

    viewModal.querySelector("#report-title").value =
      kit.title || "Untitled Kit";
    viewModal.querySelector("#report-content").value =
      kit.content || "No content available";

    let images = [];

    if (studentSubmission && studentSubmission.id) {
      try {
        const imageDocs = await firebaseCRUD.getAllData(
          `ojtkits_2/${studentSubmission.id}/images`
        );

        if (imageDocs && imageDocs.length > 0) {
          imageDocs.forEach((imageDoc) => {
            const imgSrc = imageDoc.imageData || imageDoc.image;
            if (imgSrc) {
              images.push(imgSrc);

              const thumbnailDiv = document.createElement("div");
              thumbnailDiv.className = "image-thumbnail";

              const img = document.createElement("img");
              img.src = imgSrc;
              img.alt = "Report image";
              img.loading = "lazy";

              img.addEventListener("click", () => showImageInModal(imgSrc));

              const zoomIcon = document.createElement("i");
              zoomIcon.className = "bi bi-zoom-in zoom-icon";

              thumbnailDiv.appendChild(img);
              thumbnailDiv.appendChild(zoomIcon);
              imageContainer.appendChild(thumbnailDiv);
            }
          });

          DLContainer.innerHTML = `
            <button
              class="w-100 d-flex justify-content-center"
              id="download-report-button"
              style="background-color: rgb(110, 20, 35); color: white;"
            >
              <i class="bi bi-download fs-4 me-2"></i> Download PDF
            </button>
          `;

          document
            .getElementById("download-report-button")
            .addEventListener("click", async () => {
              const button = document.getElementById("download-report-button");
              const originalIcon = button.innerHTML;

              button.innerHTML = `
              <div class="spinner-border spinner-border-sm text-light" role="status" style="width: 1.2rem; height: 1.2rem;">
                <span class="visually-hidden">Loading...</span>
              </div>
            `;
              button.disabled = true;

              try {
                const reportData = {
                  title: kit.title || "",
                  date: new Date(
                    studentSubmission.createdAt || Date.now()
                  ).toLocaleDateString(),
                  content: "",
                  images,
                  studentName: globalStudentName || "Student",
                  logoBase64: await fetchBase64("../assets/img/oc.png"),
                };

                const pdfGen = new PDFReportGenerator();
                await pdfGen.generate(reportData);

                Swal.fire({
                  icon: "success",
                  title: "Success",
                  text: "PDF exported successfully!",
                  timer: 2000,
                  showConfirmButton: false,
                });
              } catch (err) {
                console.error("Failed to generate PDF:", err);
                Swal.fire({
                  icon: "error",
                  title: "PDF Generation Failed",
                  text: "Failed to generate PDF.",
                  confirmButtonColor: "#590f1c",
                });
              } finally {
                button.innerHTML = originalIcon;
                button.disabled = false;
              }
            });
        }
      } catch (error) {
        console.error("Error loading images:", error);
      }
    }

    new bootstrap.Modal(viewModal).show();
  } catch (error) {
    console.error("Error:", error);
    Swal.fire({
      icon: "error",
      title: "Something Went Wrong",
      text: "Failed to load document.",
      confirmButtonColor: "#590f1c",
    });
  } finally {
    showLoading(false);
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
function showImageInModal(imageSrc) {
  const modal = document.createElement("div");
  modal.className = "modal fade";
  modal.innerHTML = `
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content bg-transparent border-0">
        <div class="modal-header border-0">
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body p-0 text-center">
          <img src="${imageSrc}" class="img-fluid" style="max-height: 80vh; width: auto;">
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  new bootstrap.Modal(modal).show();

  modal.addEventListener("hidden.bs.modal", () => {
    modal.remove();
  });
}

function searchStudents(searchTerm) {
  showLoading(true);
  import("./firebase-crud.js")
    .then(({ firebaseCRUD }) => {
      firebaseCRUD
        .queryData("students", "userType", "==", "student")
        .then((students) => {
          firebaseCRUD
            .queryData("students", "userType", "==", "studentAssistant")
            .then((assistants) => {
              showLoading(false);

              const allUsers = [...students, ...assistants];

              const filtered = allUsers.filter(
                (user) =>
                  user.firstName
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                  user.studentId?.includes(searchTerm) ||
                  user.companyName
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                  user.middleName
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                  user.lastName
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase())
              );
              displayStudents(filtered);
            })
            .catch((error) => {
              showLoading(false);
              console.error("Error fetching assistants:", error);
              showError("Error searching assistants: " + error.message);
            });
        })
        .catch((error) => {
          showLoading(false);
          console.error("Error fetching students:", error);
          showError("Error searching students: " + error.message);
        });
    })
    .catch((err) => {
      showLoading(false);
      console.error("Failed to load firebase-crud:", err);
      showError("Failed to load required modules. Please try again.");
    });
}

$(document).ready(function () {
  loadStudents();

  const debouncedSearch = debounce(function () {
    const searchTerm = $(".search-input input").val().trim();
    if (searchTerm.length > 0) {
      searchStudents(searchTerm);
    } else {
      loadStudents();
    }
  }, 300);

  $(".search-input input").on("input", debouncedSearch);
});

let currentEditingKitId = null;

document
  .getElementById("add-report-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const title = document.getElementById("add-report-title").value;
    const content = document.getElementById("add-report-content").value;

    if (!title || !content) {
      Swal.fire({
        icon: "warning",
        title: "All Fields Are Required",
        text: "Please fill in all required fields.",
        confirmButtonColor: "#590f1c",
      });

      return;
    }

    const submitButton = document.getElementById("add-report-button");
    const originalButtonText = submitButton.innerHTML;
    submitButton.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Adding...';
    submitButton.disabled = true;

    try {
      const { firebaseCRUD } = await import("./firebase-crud.js");
      await firebaseCRUD.createData("ojtKits", {
        title: title,
        content: content,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      });

      const modal = bootstrap.Modal.getInstance(
        document.getElementById("addOJTKITSModal")
      );
      modal.hide();

      this.reset();

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "OJT Kit added successfully!",
        timer: 2000,
        showConfirmButton: false,
      });

      loadStudents();
    } catch (error) {
      console.error("Error adding OJT Kit:", error);
      Swal.fire({
        icon: "error",
        title: "An Error Occur",
        text: `Error: ${error.message}`,
        confirmButtonColor: "#590f1c",
      });
    } finally {
      submitButton.innerHTML = originalButtonText;
      submitButton.disabled = false;
    }
  });

let selectedStudentId = null;

document
  .getElementById("floatingActionBtn")
  .addEventListener("click", function () {
    if (!selectedStudentId) {
      return;
    }
    showDocumentsModal(selectedStudentId);
  });

async function showStudentDocumentsModal(
  studentId,
  studentName,
  studentNumber
) {
  document.getElementById("studentName").textContent = studentName;
  document.getElementById("studentId").textContent = studentNumber;

  const optionsContainer = document.querySelector(
    "#studentDocumentsModal .d-flex.flex-column.gap-3"
  );
  optionsContainer.innerHTML = `
    <div class="text-center py-3">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="text-white mt-2">Loading Submitted OJT Kits...</p>
    </div>
  `;

  const modal = new bootstrap.Modal(
    document.getElementById("studentDocumentsModal")
  );
  modal.show();

  try {
    const [{ firebaseCRUD }] = await Promise.all([
      import("./firebase-crud.js"),
    ]);

    const studentReports = await firebaseCRUD.queryData(
      "ojtkits_2",
      "userId",
      "==",
      studentId
    );

    optionsContainer.innerHTML = "";

    if (studentReports && studentReports.length > 0) {
      const submittedKits = await Promise.all(
        studentReports.map(async (report) => {
          const kit = await firebaseCRUD.getDataById(
            "ojtKits",
            report.ojtKitId
          );
          return {
            ...kit,
            submittedDate: report.createdAt,
          };
        })
      );

      submittedKits.sort(
        (a, b) => new Date(b.submittedDate) - new Date(a.submittedDate)
      );

      submittedKits.forEach((kit) => {
        const submissionDate = kit.submittedDate
          ? new Date(kit.submittedDate).toLocaleDateString()
          : "Unknown date";

        const button = document.createElement("button");
        button.className =
          "document-option-btn d-flex align-items-center p-3 position-relative completed-kit";
        button.setAttribute("data-ojt-kit-id", kit.id);
        button.setAttribute("data-tooltip", `Submitted: ${submissionDate}`);

        button.innerHTML = `
          <div class="icon-container bg-success rounded-circle d-flex align-items-center justify-content-center me-3" 
               style="width: 40px; height: 40px;">
            <i class="bi bi-file-earmark-text-fill text-white"></i>
          </div>
          <span class="text-white">${kit.title || "Untitled Kit"}</span>
          <div class="position-absolute end-0 me-3" title="Submitted ${submissionDate}">
            <i class="bi bi-check-circle-fill text-success"></i>
          </div>
        `;

        button.addEventListener("click", function () {
          const kitId = this.getAttribute("data-ojt-kit-id");
          handleOjtKitSelection(studentId, kitId);
        });

        new bootstrap.Tooltip(button);

        optionsContainer.appendChild(button);
      });

      const summary = document.createElement("div");
      summary.className =
        "completion-summary text-white text-center mt-3 small";
      summary.textContent = `Submitted ${submittedKits.length} OJT Kits`;
      optionsContainer.appendChild(summary);
    } else {
      optionsContainer.innerHTML = `
        <div class="text-center text-white py-3">
          <i class="bi bi-exclamation-circle fs-4"></i>
          <p class="mt-2">No OJT Kits submitted yet</p>
        </div>
      `;
    }
  } catch (error) {
    console.error("Error loading data:", error);
    optionsContainer.innerHTML = `
      <div class="text-center text-white py-3">
        <i class="bi bi-exclamation-triangle-fill fs-4"></i>
        <p class="mt-2">Failed to load submitted kits</p>
        <button class="btn btn-sm btn-primary mt-2" onclick="showStudentDocumentsModal('${studentId}', '${studentName}', '${studentNumber}')">
          Retry
        </button>
      </div>
    `;
  }
}

function handleDocumentSelection(studentId, docType) {
  console.log(`Selected ${docType} for student ${studentId}`);

  switch (docType) {
    case "parents-waiver":
      break;
    case "ojt-payment":
      break;
    case "medical-cert":
      break;
  }

  const modal = bootstrap.Modal.getInstance(
    document.getElementById("studentDocumentsModal")
  );
  modal.hide();
}

document.querySelectorAll(".student-card").forEach((card) => {
  card.addEventListener("click", function () {
    const studentId = this.getAttribute("data-student-id");
    const studentName = this.querySelector(
      ".name-id-container p:first-child"
    ).textContent;
    const studentNumber = this.querySelector(
      ".name-id-container p:nth-child(2)"
    ).textContent;

    showStudentDocumentsModal(studentId, studentName, studentNumber);
  });
});
