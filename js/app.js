document.addEventListener("DOMContentLoaded", function () {
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
    if (!navigator.onLine) {
      checkUserTypeAndRedirect();
    }

    window.addEventListener("offline", function () {
      checkUserTypeAndRedirect();
    });
  }

  document
    .querySelectorAll('a[href*="history.html"], a[href*="report-online.html"]')
    .forEach((link) => {
      link.addEventListener("click", function (e) {
        if (!navigator.onLine) {
          e.preventDefault();
          checkUserTypeAndRedirect();
        }
      });
    });
});

function checkUserTypeAndRedirect() {
  const request = indexedDB.open("SOJTMSDB", 1);

  request.onsuccess = function(event) {
    const db = event.target.result;
    const transaction = db.transaction(["studentInfoTbl"], "readonly");
    const store = transaction.objectStore("studentInfoTbl");
    const index = store.index("userId");
    const userId = localStorage.getItem("userId"); 
    
    if (userId) {
      const getUser = index.get(userId);
      
      getUser.onsuccess = function() {
        const userData = getUser.result;
        if (userData && userData.userType === "admin") {
          window.location.href = "/pages/no-internet-admin.html";
        } else {
          window.location.href = "/pages/no-internet.html";
        }
      };
      
      getUser.onerror = function() {
        window.location.href = "index.html";
      };
    } else {
      window.location.href = "index.html";
    }
  };

  request.onerror = function() {
    window.location.href = "index.html";
  };
}

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
