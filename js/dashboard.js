function convertTo12HourFormat(time24) {
  const [hour, minute] = time24.split(":").map(Number);

  const suffix = hour >= 12 ? "pm" : "am";
  const hour12 = hour % 12 || 12;

  const time = `${hour12.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;

  return [time, suffix];
}

document.addEventListener("DOMContentLoaded", async function () {
  try {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      console.error("No userId found in localStorage");
      return;
    }

    await window.dbReady;

    const img = document.getElementById("user-img");
    const companyName = document.getElementById("company-name");
    const companyAddress = document.getElementById("company-address");
    const morningTimeIn = document.getElementById("morning-time-in");
    const morningTimeInTt = document.getElementById("morning-time-in-tt");
    const morningTimeOut = document.getElementById("morning-time-out");
    const morningTimeOutTt = document.getElementById("morning-time-out-tt");

    const afternoonTimeIn = document.getElementById("afternoon-time-in");
    const afternoonTimeInTt = document.getElementById("afternoon-time-in-tt");
    const afternoonTimeOut = document.getElementById("afternoon-time-out");
    const afternoonTimeOutTt = document.getElementById("afternoon-time-out-tt");

    const dataArray = await crudOperations.getByIndex(
      "studentInfoTbl",
      "userId",
      userId
    );

    // console.log("User data from IndexedDB:", dataArray);

    const data = Array.isArray(dataArray) ? dataArray[0] : dataArray;

    if (data != null) {
      const [morningInTime, morningInPeriod] = convertTo12HourFormat(
        data.morningTimeIn
      );
      const [morningOutTime, morningOutPeriod] = convertTo12HourFormat(
        data.morningTimeOut
      );
      const [afternoonInTime, afternoonInPeriod] = convertTo12HourFormat(
        data.afternoonTimeIn
      );
      const [afternoonOutTime, afternoonOutPeriod] = convertTo12HourFormat(
        data.afternoonTimeOut
      );

      img.src = data.userImg
        ? data.userImg
        : "../assets/img/icons8_male_user_480px_1";

      companyName.textContent = data.companyName;
      companyAddress.textContent = data.companyAddress;

      morningTimeIn.textContent = morningInTime;
      morningTimeInTt.textContent = morningInPeriod;

      morningTimeOut.textContent = morningOutTime;
      morningTimeOutTt.textContent = morningOutPeriod;

      afternoonTimeIn.textContent = afternoonInTime;
      afternoonTimeInTt.textContent = afternoonInPeriod;

      afternoonTimeOut.textContent = afternoonOutTime;
      afternoonTimeOutTt.textContent = afternoonOutPeriod;
    } else {
      console.warn("No user data found for this user.");
    }
  } catch (err) {
    console.error("Failed to get user data from IndexedDB", err);
  }
});
