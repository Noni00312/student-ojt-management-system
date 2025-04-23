document.addEventListener("DOMContentLoaded", function () {
  // Check if current page is history.html or report-online.html
  const currentPage = window.location.pathname.split("/").pop();
  const onlinePages = [
    "history.html",
    "report-online.html",
    "report-online.html",
    "assistant-report-online.html",
    "admin-assistant-report.html",
    "admin-assistant.html",
    "admin-company.html",
    "admin-dashboard.html",
    "admin-incident-report-student.html",
    "admin-incident-report.html",
    "admin-profile.html",
    "admin-student-report.html",
    "admin-student.html",
    "admin-t-i-o-company.html",
    "admin-t-i-o-students.html",
    "admin-t-i-o.html",
    "login.html",
    "register.html",
    "additional-info.html",
  ];

  if (onlinePages.includes(currentPage)) {
    // Check internet connection
    if (!navigator.onLine) {
      // Redirect to no-internet page
      window.location.href = "/pages/no-internet.html";
    }

    // Also listen for online/offline changes
    window.addEventListener("offline", function () {
      window.location.href = "/pages/no-internet.html";
    });
  }

  // Optional: For links to these pages, check before navigating
  document
    .querySelectorAll('a[href*="history.html"], a[href*="report-online.html"]')
    .forEach((link) => {
      link.addEventListener("click", function (e) {
        if (!navigator.onLine) {
          e.preventDefault();
          window.location.href = "/pages/no-internet.html";
        }
      });
    });
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .then(() => console.log("Service Worker Registered"))
    .catch((err) => console.log("Service Worker Registration Failed", err));
}

window.dbReady = initDB("SOJTMSDB", 1, [
  {
    name: "studentInfoTbl",
    options: { keyPath: "id", autoIncrement: true },
    indexes: [
      { name: "userId", keyPath: "userId", options: { unique: false } },
      { name: "studentId", keyPath: "studentId" },
      { name: "companyName", keyPath: "companyName" },
    ],
  },
  {
    name: "reportTbl",
    options: { keyPath: "id", autoIncrement: true },
    indexes: [
      { name: "userId", keyPath: "userId", options: { unique: false } },
      { name: "reportId", keyPath: "reportId", options: { unique: true } },
      { name: "createdAt", keyPath: "createdAt" },
    ],
  },
  {
    name: "assistantReportTbl",
    options: { keyPath: "id", autoIncrement: true },
    indexes: [
      { name: "userId", keyPath: "userId", options: { unique: false } },
      { name: "reportId", keyPath: "reportId", options: { unique: true } },
      { name: "createdAt", keyPath: "createdAt" },
    ],
  },
  {
    name: "companyTbl",
    options: { keyPath: "id", autoIncrement: true },
    indexes: [
      {
        name: "companyName",
        keyPath: "companyName",
        options: { unique: false },
      },
      {
        name: "companyLocation",
        keyPath: "companyLocation",
      },
    ],
  },
  {
    name: "timeInOut",
    options: { keyPath: "id", autoIncrement: true },
    indexes: [
      {
        name: "userId",
        keyPath: "userId",
      },
      {
        name: "time",
        keyPath: "time",
      },
      {
        name: "image",
        keyPath: "image",
      },
      {
        name: "date",
        keyPath: "date",
      },
    ],
  },

  {
    name: "completeAttendanceTbl",
    options: { keyPath: "userId" },
    indexes: [
      {
        name: "userId",
        keyPath: "userId",
      },
      {
        name: "date",
        keyPath: "date",
      },
      {
        name: "status",
        keyPath: "status",
      },
    ],
  },

  {
    name: "companyUsersTbl",
    options: { keyPath: "id" },
    indexes: [
      {
        name: "companyName",
        keyPath: "companyName",
        options: { unique: false },
      },
      {
        name: "date",
        keyPath: "date",
        options: { unique: false },
      },
      {
        name: "users",
        keyPath: "users",
        options: { unique: false, multiEntry: true },
      },
    ],
  },
]).then(() => {
  console.log("IndexedDB is ready.");
});

function clearAllLocalStorage() {
  localStorage.clear();
  console.log("All local storage has been cleared.");
}
