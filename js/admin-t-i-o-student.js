import { firebaseCRUD } from "./firebase-crud.js";

window.document.addEventListener("DOMContentLoaded", async () => {
  await window.dbReady;
  const urlParams = new URLSearchParams(window.location.search);
  const date = urlParams.get("date");
  const companyName = urlParams.get("company-name");

  const students = await loadStudent(`${companyName}_${date}`);

  const finalResult = await Promise.all(
    students.map(async (student) => {
      const attendance = await getStudentAttendanceRecord(student.userId, date);
      const hasIncident = await checkHasIncidentReport(student.userId, date);

      return {
        userId: student.userId,
        isPresent: attendance?.isPresent ?? false,
        isLate: attendance?.isLate ?? false,
        date: attendance?.date ?? date,
        firstName: student.firstName ?? "",
        middleName: student.middleName ?? "",
        lastName: student.lastName ?? "",
        suffix: student.suffix ?? "",
        image: student.image ?? "",
        hasIncidentReport: hasIncident,
      };
    })
  );

  console.log(finalResult);
});

async function loadStudent(companyUserIdData) {
  const userIds = await crudOperations
    .getData("companyUsersTbl", companyUserIdData)
    .then((record) => record?.users || [])
    .catch((err) => {
      console.error("Error fetching record:", err);
      return [];
    });

  const userDataNested = await Promise.all(
    userIds.map((userId) =>
      firebaseCRUD.queryData("students", "userId", "==", userId)
    )
  );

  const userData = userDataNested.flat().map((user) => ({
    userId: user.userId,
    firstName: user.firstName,
    middleName: user.middleName,
    lastName: user.lastName,
    suffix: user.suffix,
    image: user.userImg || "",
  }));

  return userData;
}

async function getStudentAttendanceRecord(studentId, date) {
  const records = await firebaseCRUD.queryData(
    "completeAttendanceTbl",
    "userId",
    "==",
    studentId
  );

  if (!records || records.length === 0) return null;

  const inputDate = new Date(date).toISOString().split("T")[0];

  const attendanceRecord = records.find((record) => {
    if (!record.date) return false;
    const recordDate =
      typeof record.date === "string"
        ? new Date(record.date).toISOString().split("T")[0]
        : record.date.toDate().toISOString().split("T")[0];

    return recordDate === inputDate;
  });

  if (!attendanceRecord) return null;

  return {
    isPresent: attendanceRecord.isPresent ?? false,
    isLate: attendanceRecord.isLate ?? false,
    date: attendanceRecord.date,
  };
}

async function checkHasIncidentReport(studentId, date) {
  const records = await firebaseCRUD.queryData(
    "incidentreports",
    "userId",
    "==",
    studentId
  );

  if (!records || records.length === 0) return false;

  const inputDate = new Date(date).toISOString().split("T")[0];

  const incidentRecord = records.find((record) => {
    if (!record.date) return false;
    const recordDate =
      typeof record.date === "string"
        ? new Date(record.date).toISOString().split("T")[0]
        : record.date.toDate().toISOString().split("T")[0];

    return recordDate === inputDate;
  });

  return !!incidentRecord;
}
