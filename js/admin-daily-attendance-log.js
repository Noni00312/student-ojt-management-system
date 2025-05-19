document.addEventListener("DOMContentLoaded", async function () {
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

    const data = Array.isArray(dataArray) ? dataArray[0] : dataArray;

    if (data != null) {
      img.src = data.userImg
        ? data.userImg
        : "../assets/img/icons8_male_user_480px_1";
    } else {
      console.warn("No user data found for this user.");
    }
  } catch (err) {
    console.error("Failed to get user data from IndexedDB", err);
  }
});

let currentFilters = {
  province: "",
  status: "All",
  searchTerm: "",
};

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

let allUsersList = [];
document
  .getElementById("filter-all")
  .addEventListener("click", () => filterUsers("All"));
document
  .getElementById("filter-present")
  .addEventListener("click", () => filterUsers("Present"));
document
  .getElementById("filter-absent")
  .addEventListener("click", () => filterUsers("Absent"));
document
  .getElementById("filter-nologs")
  .addEventListener("click", () => filterUsers("No Logs"));

function applyAllFilters() {
  let filtered = allUsersList;

  if (currentFilters.province) {
    filtered = filtered.filter(
      (user) =>
        user.companyProvince?.toLowerCase().trim() ===
        currentFilters.province.toLowerCase().trim()
    );
  }

  if (currentFilters.status !== "All") {
    filtered = filtered.filter(
      (user) => user.badgeStatus === currentFilters.status
    );
  }

  if (currentFilters.searchTerm) {
    const term = currentFilters.searchTerm.toLowerCase();
    filtered = filtered.filter(
      (user) =>
        user.firstName?.toLowerCase().includes(term) ||
        user.studentId?.includes(term) ||
        user.companyName?.toLowerCase().includes(term) ||
        user.middleName?.toLowerCase().includes(term) ||
        user.lastName?.toLowerCase().includes(term)
    );
  }

  displayStudents(filtered);
}

async function loadStudents() {
  showLoading(true);

  try {
    const { firebaseCRUD } = await import("./firebase-crud.js");

    const [students, assistants] = await Promise.all([
      firebaseCRUD.queryData("students", "userType", "==", "student"),
      firebaseCRUD.queryData("students", "userType", "==", "studentAssistant"),
    ]);

    const allUsers = [...students, ...assistants];
    const today = new Date().toISOString().split("T")[0];

    const updatedUsers = await Promise.all(
      allUsers.map(async (user) => {
        try {
          const statusResult = await firebaseCRUD.getDocsFromPath(
            `attendancelogs/${user.userId}/${today}/status`
          );
          const statusDoc = statusResult?.data;

          if (statusDoc?.attendanceStatus === "Present") {
            user.badgeStatus = "Present";
          } else if (statusDoc?.attendanceStatus === "Absent") {
            user.badgeStatus = "Absent";
          } else {
            user.badgeStatus = "No Logs";
          }
        } catch (err) {
          user.badgeStatus = "No Logs";
        }

        return user;
      })
    );

    allUsersList = updatedUsers;
    showLoading(false);
    applyAllFilters();
  } catch (error) {
    showLoading(false);
    console.error("Failed to load students and attendance status:", error);
    showError("Failed to load students. Please try again.");
  }
}

function displayStudents(students) {
  const cardContainer = document.querySelector(".card-container .row");
  cardContainer.innerHTML = "";

  if (!students || students.length === 0) {
    cardContainer.innerHTML = `
            <div class="position-absolute top-50 start-50 translate-middle col-12 text-center py-4">
                <i class="bi bi-exclamation-circle fs-1 text-muted"></i>
                <h6 class="mt-2">No Students Available</h6>
                <p class="mt-1">No students found for this category.</p>
            </div>
        `;
    return;
  }

  students.forEach((student) => {
    const colDiv = document.createElement("div");
    colDiv.className = "col-lg-4 col-md-6 px-2";

    colDiv.innerHTML = `
            <div class="student-card h-100"> 
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
                            <p class="m-0 text-truncate fw-bold">${
                              student.firstName +
                                " " +
                                (student.middleName
                                  ? student.middleName + " "
                                  : "") +
                                student.lastName +
                                (student.suffix ? " " + student.suffix : "") ||
                              "No name"
                            }</p>
                            <p class="m-0 ms-2 text-nowrap">${
                              student.studentId || "No ID"
                            }</p>
                            <p class="d-none">${student.userId || ""}</p>
                        </div>
                        <div class="separator my-2"></div>
                        <div class="company">
                          <p class="m-0 badge bg-${(() => {
                            if (student.badgeStatus === "Present")
                              return "success";
                            if (student.badgeStatus === "Absent")
                              return "danger";
                            return "warning";
                          })()}">${student.badgeStatus || "No Logs"}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

    cardContainer.appendChild(colDiv);
  });
}

document.addEventListener("DOMContentLoaded", function () {
  currentFilters = {
    province: "",
    status: "All",
    searchTerm: "",
  };

  const provinceFilter = document.getElementById("provinceFilter");
  if (provinceFilter) {
    populateProvinceDropdown(provinceFilter);
    provinceFilter.addEventListener("change", function () {
      filterStudentsByProvince(this.value);
    });
  }

  const searchInput = document.getElementById("companySearch");
  if (searchInput) {
    const debouncedSearch = debounce(function (e) {
      filterStudents(e.target.value);
    }, 300);
    searchInput.addEventListener("input", debouncedSearch);
  }

  loadStudents();
});

function filterStudentsByProvince(province) {
  currentFilters.province = province;
  currentFilters.searchTerm = "";
  document.getElementById("companySearch").value = "";
  applyAllFilters();
}

function filterUsers(status) {
  currentFilters.status = status;
  currentFilters.searchTerm = "";
  document.getElementById("companySearch").value = "";
  applyAllFilters();
}

function filterStudents(searchTerm) {
  currentFilters.searchTerm = searchTerm;
  applyAllFilters();
}

function populateProvinceDropdown(selectElement) {
  const provinces = {
    "Cordillera Administrative Region": [
      "Benguet",
      "Ifugao",
      "Kalinga",
      "Mountain Province",
    ],
    "I - Ilocos Region": [
      "Ilocos Norte",
      "Ilocos Sur",
      "La Union",
      "Pangasinan",
    ],
    "II - Cagayan Valley": [
      "Batanes",
      "Cagayan",
      "Isabela",
      "Nueva Vizcaya",
      "Quirino",
    ],
    "III - Central Luzon": [
      "Bataan",
      "Bulacan",
      "Nueva Ecija",
      "Pampanga",
      "Tarlac",
      "Zambales",
      "Aurora",
    ],
    "IVA - CALABARZON": ["Batangas", "Cavite", "Laguna", "Quezon", "Rizal"],
    "IVB - MIMAROPA": [
      "Marinduque",
      "Occidental Mindoro",
      "Oriental Mindoro",
      "Palawan",
      "Romblon",
    ],
    "V - Bicol Region": [
      "Albay",
      "Camarines Norte",
      "Camarines Sur",
      "Catanduanes",
      "Masbate",
      "Sorsogon",
    ],
    "VI - Western Visayas": [
      "Aklan",
      "Antique",
      "Capiz",
      "Iloilo",
      "Negros Occidental",
      "Guimaras",
    ],
    "VII - Central Visayas": ["Bohol", "Cebu", "Negros Oriental", "Siquijor"],
    "VIII - Eastern Visayas": [
      "Eastern Samar",
      "Leyte",
      "Northern Samar",
      "Samar (Western Samar)",
      "Southern Leyte",
      "Biliran",
    ],
    "IX - Zamboanga Peninsula": [
      "Zamboanga del Norte",
      "Zamboanga del Sur",
      "Zamboanga Sibugay",
    ],
    "X - Northern Mindanao": [
      "Bukidnon",
      "Camiguin",
      "Lanao del Norte",
      "Misamis Occidental",
      "Misamis Oriental",
    ],
    "XI - Davao Region": [
      "Davao del Norte",
      "Davao del Sur",
      "Davao Oriental",
      "Davao de Oro",
      "Davao Occidental",
    ],
    "XII - SOCCSKSARGEN": [
      "North Cotabato",
      "South Cotabato",
      "Sultan Kudarat",
      "Sarangani",
      "Cotabato City",
    ],
    Caraga: [
      "Agusan del Norte",
      "Agusan del Sur",
      "Surigao del Norte",
      "Surigao del Sur",
    ],
    "Autonomous Region in Muslim Mindanao": [
      "Maguindanao",
      "Lanao del Sur",
      "Basilan",
      "Sulu",
      "Tawi-Tawi",
    ],
  };

  selectElement.innerHTML = "";

  const allProvincesOption = document.createElement("option");
  allProvincesOption.value = "";
  allProvincesOption.textContent = "All Provinces";
  allProvincesOption.selected = true;
  selectElement.appendChild(allProvincesOption);

  for (const [region, regionProvinces] of Object.entries(provinces)) {
    const optgroup = document.createElement("optgroup");
    optgroup.label = region;

    regionProvinces.forEach((province) => {
      const option = document.createElement("option");
      option.value = province;
      option.textContent = province;
      optgroup.appendChild(option);
    });

    selectElement.appendChild(optgroup);
  }
}
