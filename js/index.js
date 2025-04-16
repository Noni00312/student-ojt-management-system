const dbName = "SOJTMSDB";
const dbVersion = "1";

initDB(dbName, dbVersion, [
  {
    name: "studentInfoTbl",
    option: { keypath: "id", autoincrement: true },
    indexes: [
      { name: "userId", keypath: "userId", options: { unique: true } },
      { name: "studentId", keypath: "studentId" },
      { name: "companyName", keypath: "companyName" },
    ],
  },
  {
    name: "recordTbl",
    option: { keypath: "id", autoincrement: true },
    indexes: [
      { name: "userId", keypath: "userId", options: { unique: true } },
      { name: "recordId", keypath: "recordId", options: { unique: true } },
      { name: "createdAt", keypath: "createdAt" },
    ],
  },
]).then(() => {
  console.log("Database initialize with version ", dbVersion);
});
