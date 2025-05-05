import { firebaseCRUD } from "./firebase-crud.js";

async function fetchUserProfileFromFirebase(userId) {
  try {
    const firebaseData = await firebaseCRUD.queryData("students", "userId", "==", userId);
    if (firebaseData && firebaseData.length > 0) {
      return firebaseData[0];
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch profile from Firebase:", error);
    return null;
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  try {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.error("No userId found in localStorage");
      window.location.href = "/pages/login.html";
      return;
    }

    await window.dbReady;

    const userImg = document.querySelector(".profile-icon");
    const userName = document.querySelector("#profile-name");
    const studentId = document.getElementById("student-id");
    const emailAddress = document.getElementById("email");
    const phoneNumber = document.getElementById("phone-number");
    const gender = document.getElementById("gender");
    const address = document.getElementById("address");
    const companyName = document.getElementById("company-name");
    const companyAddress = document.getElementById("company-address");
    const workSchedule = document.getElementById("work-schedule");
    const morningTimeIn = document.getElementById("morning-time-in");
    const morningTimeOut = document.getElementById("morning-time-out");
    const afternoonTimeIn = document.getElementById("afternoon-time-in");
    const afternoonTimeOut = document.getElementById("afternoon-time-out");
    const editButton = document.getElementById("edit-button");
    const editProfileModal = document.getElementById("editProfileModal");
    const imgButton = document.getElementById("img-button");
    const logoutButton = document.getElementById("logout-button");

    async function hasPendingTimeEntries(userId) {
      try {
        const today = new Date().toLocaleDateString("en-CA");
        
        const completeAttendance = await crudOperations.getByIndex(
          "completeAttendanceTbl",
          "userId",
          userId
        );
        
        const todayComplete = completeAttendance.find(entry => entry.date === today);
        if (todayComplete && todayComplete.status === "complete") {
          return false; 
        }
    
        const logs = await crudOperations.getByIndex("timeInOut", "userId", userId);
        const todayLogs = logs.filter(log => log.date === today);
        
        const userDataArray = await crudOperations.getByIndex(
          "studentInfoTbl",
          "userId",
          userId
        );
        const userData = Array.isArray(userDataArray) ? userDataArray[0] : userDataArray;
        
        if (!userData || !userData.weeklySchedule) return false;
        
        const dayNames = ["SUN", "MON", "TUE", "WED", "THURS", "FRI", "SAT"];
        const todayDay = new Date().getDay();
        const todaySchedule = dayNames[todayDay];
        
        if (!userData.weeklySchedule[todaySchedule]) {
          return false; 
        }
        
        const expectedLogs = [];
        if (userData.morningTimeIn && userData.morningTimeOut) {
          expectedLogs.push("morningTimeIn", "morningTimeOut");
        }
        if (userData.afternoonTimeIn && userData.afternoonTimeOut) {
          expectedLogs.push("afternoonTimeIn", "afternoonTimeOut");
        }
        
        const loggedTypes = todayLogs.map(log => log.type);
        return expectedLogs.some(type => !loggedTypes.includes(type));
      } catch (error) {
        console.error("Error checking pending time entries:", error);
        return false;
      }
    }

    function setupEditButton(editButton) {
      const updateButtonState = async () => {
        const userId = localStorage.getItem("userId");
        const hasPending = userId ? await hasPendingTimeEntries(userId) : false;
        
        if (!navigator.onLine) {
          editButton.classList.add("disabled", "btn-disabled");
          editButton.setAttribute("title", "Edit requires internet connection");
          editButton.setAttribute("data-bs-toggle", "offline");
          editButton.removeAttribute("data-bs-target");
          editButton.style.cursor = "not-allowed";
          editButton.style.opacity = "0.5";
        } else if (hasPending) {
          editButton.classList.add("disabled", "btn-disabled");
          editButton.setAttribute("title", "Complete your time entries for today before editing");
          editButton.setAttribute("data-bs-toggle", "offline");
          editButton.removeAttribute("data-bs-target");
          editButton.style.cursor = "not-allowed";
          editButton.style.opacity = "0.5";
        } else {
          editButton.classList.remove("disabled", "btn-disabled");
          editButton.setAttribute("title", "Edit Profile");
          editButton.setAttribute("data-bs-toggle", "modal");
          editButton.setAttribute("data-bs-target", "#editProfileModal");
          editButton.style.cursor = "pointer";
          editButton.style.opacity = "1";
        }
      };

      updateButtonState();

      editButton.addEventListener("click", async (e) => {
        if (!navigator.onLine) {
          e.preventDefault();
          e.stopPropagation();
          window.location.href = "no-internet.html";
          return false;
        }
        
        const userId = localStorage.getItem("userId");
        const hasPending = userId ? await hasPendingTimeEntries(userId) : false;
        
        if (hasPending) {
          e.preventDefault();
          e.stopPropagation();
          alert("Please complete all your time entries for today before editing your profile.");
          return false;
        }
      });

      window.addEventListener("online", updateButtonState);
      window.addEventListener("offline", updateButtonState);

      const modal = new bootstrap.Modal(
        document.getElementById("editProfileModal")
      );
      
      document
        .getElementById("editProfileModal")
        .addEventListener("show.bs.modal", async (e) => {
          if (!navigator.onLine) {
            e.preventDefault();
            alert(
              "Editing profile requires an internet connection. Please check your network and try again."
            );
            modal.hide();
            return;
          }
          
          const userId = localStorage.getItem("userId");
          const hasPending = userId ? await hasPendingTimeEntries(userId) : false;
          
          if (hasPending) {
            e.preventDefault();
            alert("Please complete all your time entries for today before editing your profile.");
            modal.hide();
            return;
          }

          let modalUserData = null;
          try {
            if (navigator.onLine) {
              modalUserData = await fetchUserProfileFromFirebase(userId);
            }
            
            if (!modalUserData) {
              const dataArray = await crudOperations.getByIndex(
                "studentInfoTbl",
                "userId",
                userId
              );
              modalUserData = Array.isArray(dataArray) ? dataArray[0] : dataArray;
            }
          } catch (error) {
            console.error("Error loading profile for edit modal:", error);
          }

          if (modalUserData) {
            populateEditForm(modalUserData);
          } else {
            e.preventDefault();
            alert("Failed to load your profile data.");
            modal.hide();
          }
        });
    }

    setupEditButton(editButton);

    let userData;
    try {
      if (navigator.onLine) {
        userData = await fetchUserProfileFromFirebase(userId);
      }
      
      // If no Firebase data or offline, get from IndexedDB
      if (!userData) {
        const dataArray = await crudOperations.getByIndex(
          "studentInfoTbl",
          "userId",
          userId
        );
        userData = Array.isArray(dataArray) ? dataArray[0] : dataArray;
      }
      
      // If we got Firebase data, update IndexedDB to keep it in sync
      if (navigator.onLine && userData) {
        try {
          await crudOperations.updateData(
            "studentInfoTbl",
            userData.id || userId,
            userData
          );
        } catch (error) {
          console.error("IndexedDB sync error:", error);
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }

    if (userData) {
      updateProfileUI(userData);
      await loadCompanyData();
      populateEditForm(userData);
    } else {
      console.warn("No user data found");
    }

    const editForm = document.getElementById("ojtForm");
    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const submitButton = editForm.querySelector("button[type='submit']");
      submitButton.disabled = true;
      submitButton.innerHTML =
        '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Updating...';

      const hasPending = await hasPendingTimeEntries(userId);
      if (hasPending) {
        alert("Cannot update profile while having pending time entries for today.");
        submitButton.disabled = false;
        submitButton.innerHTML = "<span>Update Profile</span>";
        return;
      }

      try {
        const formData = new FormData(editForm);
        const updatedData = {
          firstName: formData.get("first-name").trim(),
          middleName: formData.get("middle-name").trim(),
          lastName: formData.get("last-name").trim(),
          suffix: formData.get("suffix").trim(),
          studentId: formData.get("student-id").trim(),
          phoneNumber: formData.get("phone-number").trim(),
          gender: formData.get("gender"),
          address: formData.get("address").trim(),
          companyName: formData.get("company-name").trim(),
          companyAddress: formData.get("company-address").trim(),
          morningTimeIn: formData.get("morning-time-in"),
          morningTimeOut: formData.get("morning-time-out"),
          afternoonTimeIn: formData.get("afternoon-time-in"),
          afternoonTimeOut: formData.get("afternoon-time-out"),
          weeklySchedule: {
            SUN: formData.getAll("work-schedule").includes("Sun"),
            MON: formData.getAll("work-schedule").includes("Mon"),
            TUE: formData.getAll("work-schedule").includes("Tue"),
            WED: formData.getAll("work-schedule").includes("Wed"),
            THURS: formData.getAll("work-schedule").includes("Thu"),
            FRI: formData.getAll("work-schedule").includes("Fri"),
            SAT: formData.getAll("work-schedule").includes("Sat"),
          },
          updatedAt: new Date().toISOString(),
          userId: userId,
        };

        const docId = userData?.id || userId;
        
        if (navigator.onLine) {
          await firebaseCRUD.updateData("students", docId, updatedData);
        }
        
        await crudOperations.updateData("studentInfoTbl", docId, updatedData);

        const updatedDataArray = await crudOperations.getByIndex(
          "studentInfoTbl",
          "userId",
          userId
        );
        const updatedUserData = Array.isArray(updatedDataArray)
          ? updatedDataArray[0]
          : updatedDataArray;
        updateProfileUI(updatedUserData);

        const modal = bootstrap.Modal.getInstance(editProfileModal);
        modal.hide();

        alert('Profile updated successfully!');
      } catch (error) {
        console.error("Update error:", error);
        alert('Failed to update profile. Please try again.');
      } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = "<span>Update Profile</span>";
      }
    });

    const imgInput = document.createElement("input");
    imgInput.type = "file";
    imgInput.accept = "image/*";
    imgInput.style.display = "none";
    document.body.appendChild(imgInput);

    imgButton.addEventListener("click", (e) => {
      e.preventDefault();
      imgInput.click();
    });

    imgInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const editProfileImg = document.querySelector(".modal-profile-icon");
      const previewUrl = URL.createObjectURL(file);
      editProfileImg.src = previewUrl;

      try {
        const base64Image = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const docId = userData?.id || userId;
        await crudOperations.updateData("studentInfoTbl", docId, {
          userImg: base64Image
        });

        if (navigator.onLine) {
          await firebaseCRUD.updateData("students", docId, {
            userImg: base64Image
          });
        }

        userImg.src = base64Image;
        editProfileImg.src = base64Image;
        URL.revokeObjectURL(previewUrl);

        alert('Profile image updated successfully!');
      } catch (error) {
        console.error("Image upload error:", error);
        alert('Failed to update profile image');
        editProfileImg.src = userImg.src;
      }
    });

    logoutButton.addEventListener("click", async function (e) {
      e.preventDefault();

      if (!navigator.onLine) {
        alert('You need internet connection to logout');
        return;
      }

      const result = confirm("Are you sure you want to logout?");
      if (!result) return;

      try {
        logoutButton.disabled = true;
        logoutButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging out...';
        
        await crudOperations.clearTable("studentInfoTbl");
        localStorage.removeItem("userId");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userToken");

        window.location.href = "/pages/login.html";
      } catch (error) {
        console.error("Logout error:", error);
        alert('An error occurred during logout');
        logoutButton.disabled = false;
        logoutButton.innerHTML = 'Logout';
      }
    });

    async function loadCompanyData() {
      try {
        let companies = await crudOperations.getAllData("companyTbl");
        
        if ((!companies || companies.length === 0) && navigator.onLine) {
          companies = await firebaseCRUD.getAllData("company");
          
          if (companies && companies.length > 0) {
            await crudOperations.clearTable("companyTbl");
            for (const company of companies) {
              await crudOperations.createData("companyTbl", company);
            }
          }
        }
        
        await populateCompanyDropdown();
        setupCompanySelectListener();
      } catch (error) {
        console.error("Company data load error:", error);
      }
    }

  } catch (error) {
    console.error("Initialization error:", error);
    alert('Failed to initialize profile page');
    window.location.href = "/pages/login.html";
  }
});

function convertTo12HourFormat(time24) {
  if (!time24) return ["", ""];

  const [hour, minute] = time24.split(":").map(Number);
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;

  const time = `${hour12.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;

  return [time, suffix];
}

function formatWeeklySchedule(weeklySchedule) {
  if (!weeklySchedule) return "";

  const daysMap = {
    SUN: "Sun",
    MON: "Mon",
    TUE: "Tue",
    WED: "Wed",
    THURS: "Thu",
    FRI: "Fri",
    SAT: "Sat",
  };

  const activeDays = [];
  for (const [day, isActive] of Object.entries(weeklySchedule)) {
    if (isActive && daysMap[day]) {
      activeDays.push(daysMap[day]);
    }
  }

  return activeDays.join(", ");
}

async function updateUserData(docId, updatedData) {
  try {
    await crudOperations.updateData("studentInfoTbl", docId, updatedData);
    console.log("IndexedDB updated successfully");

    if (navigator.onLine) {
      await firebaseCRUD.updateData("students", docId, updatedData);
      console.log("Firebase updated successfully");
    }

    return true;
  } catch (error) {
    console.error("Error updating user data:", error);
    return false;
  }
}

async function handleImageUpload(userId, file) {
  try {
    const base64Image = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const studentData = await firebaseCRUD.queryData(
      "students",
      "userId",
      "==",
      userId
    );
    if (!studentData || studentData.length === 0) {
      throw new Error("Student document not found");
    }
    const docId = studentData[0].id;

    await firebaseCRUD.updateData("students", docId, { userImg: base64Image });
    return base64Image;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
}

function updateProfileUI(data) {
  const userImg = document.querySelector(".profile-icon");
  const userName = document.querySelector("#profile-name");
  const studentId = document.getElementById("student-id");
  const emailAddress = document.getElementById("email");
  const phoneNumber = document.getElementById("phone-number");
  const gender = document.getElementById("gender");
  const address = document.getElementById("address");
  const companyName = document.getElementById("company-name");
  const companyAddress = document.getElementById("company-address");
  const workSchedule = document.getElementById("work-schedule");
  const morningTimeIn = document.getElementById("morning-time-in");
  const morningTimeOut = document.getElementById("morning-time-out");
  const afternoonTimeIn = document.getElementById("afternoon-time-in");
  const afternoonTimeOut = document.getElementById("afternoon-time-out");

  if (data.userImg) userImg.src = data.userImg;
  if (data.firstName && data.lastName) {
    const middleInitial = data.middleName
      ? ` ${data.middleName.charAt(0)}.`
      : "";
    const suffix = data.suffix ? ` ${data.suffix}` : "";
    userName.textContent = `${data.lastName}, ${data.firstName}${middleInitial}${suffix}`;
  }
  if (data.studentId) studentId.textContent = data.studentId;
  if (data.emailAddress) emailAddress.textContent = data.emailAddress;
  if (data.phoneNumber) phoneNumber.textContent = data.phoneNumber;
  if (data.gender)
    gender.textContent =
      data.gender.charAt(0).toUpperCase() + data.gender.slice(1);
  if (data.address) address.textContent = data.address;
  if (data.companyName) companyName.textContent = data.companyName;
  if (data.companyAddress) companyAddress.textContent = data.companyAddress;
  if (data.weeklySchedule)
    workSchedule.textContent = formatWeeklySchedule(data.weeklySchedule);

  if (data.morningTimeIn) {
    const [morningInTime, morningInPeriod] = convertTo12HourFormat(
      data.morningTimeIn
    );
    morningTimeIn.textContent = `${morningInTime} ${morningInPeriod}`;
  }
  if (data.morningTimeOut) {
    const [morningOutTime, morningOutPeriod] = convertTo12HourFormat(
      data.morningTimeOut
    );
    morningTimeOut.textContent = `${morningOutTime} ${morningOutPeriod}`;
  }
  if (data.afternoonTimeIn) {
    const [afternoonInTime, afternoonInPeriod] = convertTo12HourFormat(
      data.afternoonTimeIn
    );
    afternoonTimeIn.textContent = `${afternoonInTime} ${afternoonInPeriod}`;
  }
  if (data.afternoonTimeOut) {
    const [afternoonOutTime, afternoonOutPeriod] = convertTo12HourFormat(
      data.afternoonTimeOut
    );
    afternoonTimeOut.textContent = `${afternoonOutTime} ${afternoonOutPeriod}`;
  }
}

function populateEditForm(data) {
  const firstNameInput = document.getElementById("first-name");
  const middleNameInput = document.getElementById("middle-name");
  const lastNameInput = document.getElementById("last-name");
  const suffixInput = document.getElementById("suffix");
  const studentIdInput = document.getElementById("modal-student-id");
  const phoneNumberInput = document.getElementById("modal-phone-number");
  const genderInput = document.getElementById("modal-gender");
  const addressInput = document.getElementById("modal-address");
  const companyNameInput = document.getElementById("modal-company-name");
  const companyAddressInput = document.getElementById("modal-company-address");
  const morningTimeInInput = document.getElementById("modal-morning-time-in");
  const morningTimeOutInput = document.getElementById("modal-morning-time-out");
  const afternoonTimeInInput = document.getElementById(
    "modal-afternoon-time-in"
  );
  const afternoonTimeOutInput = document.getElementById(
    "modal-afternoon-time-out"
  );
  const editProfileImg = document.querySelector(".modal-profile-icon");

  if (data.firstName) firstNameInput.value = data.firstName.trim();
  if (data.middleName) middleNameInput.value = data.middleName.trim();
  if (data.lastName) lastNameInput.value = data.lastName.trim();
  if (data.suffix) suffixInput.value = data.suffix.trim();
  if (data.studentId) studentIdInput.value = data.studentId;
  if (data.phoneNumber) phoneNumberInput.value = data.phoneNumber;
  if (data.address) addressInput.value = data.address;

  if (data.gender) {
    genderInput.value = data.gender;
    const options = genderInput.options;
    for (let i = 0; i < options.length; i++) {
      if (options[i].value === data.gender) {
        genderInput.selectedIndex = i;
        break;
      }
    }
  }
  if (data.companyName) {
    companyNameInput.value = data.companyName;
    const event = new Event("change");
    companyNameInput.dispatchEvent(event);
  }

  if (data.companyAddress) {
    companyAddressInput.value = data.companyAddress;
  }

  if (data.morningTimeIn) morningTimeInInput.value = data.morningTimeIn;
  if (data.morningTimeOut) morningTimeOutInput.value = data.morningTimeOut;
  if (data.afternoonTimeIn) afternoonTimeInInput.value = data.afternoonTimeIn;
  if (data.afternoonTimeOut)
    afternoonTimeOutInput.value = data.afternoonTimeOut;

  if (data.userImg) editProfileImg.src = data.userImg;

  if (data.weeklySchedule) {
    const dayMapping = {
      SUN: "btn-sun",
      MON: "btn-mon",
      TUE: "btn-tue",
      WED: "btn-wed",
      THURS: "btn-thu",
      FRI: "btn-fri",
      SAT: "btn-sat",
    };

    for (const [day, isActive] of Object.entries(data.weeklySchedule)) {
      if (isActive && dayMapping[day]) {
        const checkboxId = dayMapping[day];
        const checkbox = document.getElementById(checkboxId);
        if (checkbox) {
          checkbox.checked = true;
          const label = document.querySelector(`label[for="${checkboxId}"]`);
          if (label) {
            label.classList.remove("btn-outline-primary");
            label.classList.add("btn-primary");
          }
        }
      }
    }
  }
}

async function loadCompanyData() {
  try {
    const companies = await firebaseCRUD.getAllData("company");

    if (!companies || companies.length === 0) {
      console.warn("No company data found in Firestore.");
      return;
    }

    const existingCompanies = await crudOperations.getAllData("companyTbl");
    if (existingCompanies && existingCompanies.length > 0) {
      await crudOperations.clearTable("companyTbl");
    }

    for (const company of companies) {
      await crudOperations.createData("companyTbl", company);
    }

    await populateCompanyDropdown();
    setupCompanySelectListener();
  } catch (err) {
    console.error("Failed to fetch and cache companies:", err);
  }
}

async function populateCompanyDropdown() {
  const selectCompany = document.getElementById("modal-company-name");

  while (selectCompany.options.length > 1) {
    selectCompany.remove(1);
  }

  try {
    const companies = await crudOperations.getAllData("companyTbl");

    if (!companies || companies.length === 0) {
      console.warn("No companies found in IndexedDB.");
      return;
    }

    for (const company of companies) {
      const option = document.createElement("option");
      option.value = company.companyName;
      option.textContent = company.companyName;
      selectCompany.appendChild(option);
    }
  } catch (err) {
    console.error("Failed to load companies from IndexedDB:", err);
  }
}

function setupCompanySelectListener() {
  const selectCompany = document.getElementById("modal-company-name");
  const addressInput = document.getElementById("modal-company-address");

  selectCompany.addEventListener("change", async function () {
    const selectedName = this.value;

    try {
      const companies = await crudOperations.getAllData("companyTbl");
      const selectedCompany = companies.find(
        (company) => company.companyName === selectedName
      );

      if (selectedCompany) {
        addressInput.value = selectedCompany.companyAddress || "";
      } else {
        addressInput.value = "";
        console.warn("Selected company not found in IndexedDB.");
      }
    } catch (err) {
      console.error("Failed to fetch company address:", err);
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  const logoutButton = document.getElementById("logout-button");

  function updateLogoutButtonState() {
    if (!navigator.onLine) {
      logoutButton.disabled = true;
      logoutButton.title = "Internet connection required to logout";
      logoutButton.style.cursor = "not-allowed";
      logoutButton.style.opacity = "0.6";
    } else {
      logoutButton.disabled = false;
      logoutButton.title = "";
      logoutButton.style.cursor = "pointer";
      logoutButton.style.opacity = "1";
    }
  }

  updateLogoutButtonState();

  window.addEventListener('online', updateLogoutButtonState);
  window.addEventListener('offline', updateLogoutButtonState);

  if (logoutButton) {
    logoutButton.addEventListener("click", async function (e) {
      e.preventDefault();

      if (!navigator.onLine) {
        alert('You need internet connection to logout');
        return;
      }

      const confirmed = confirm('Are you sure you want to logout?');
      
      if (confirmed) {
        try {
          logoutButton.disabled = true;
          logoutButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging out...';
          
          await crudOperations.clearTable("studentInfoTbl");
          localStorage.removeItem("userId");
          localStorage.removeItem("userEmail");
          localStorage.removeItem("userToken");

          window.location.href = "/pages/login.html";
        } catch (error) {
          console.error("Logout error:", error);
          alert('An error occurred during logout');
          logoutButton.disabled = false;
          logoutButton.innerHTML = 'Logout';
        }
      }
    });
  }
});
