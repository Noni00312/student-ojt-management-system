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
      { name: "userId", keyPath: "userId", options: { unique: true } },
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
]).then(() => {
  console.log("IndexedDB is ready.");
});

function clearAllLocalStorage() {
  localStorage.clear();
  console.log("All local storage has been cleared.");
}
