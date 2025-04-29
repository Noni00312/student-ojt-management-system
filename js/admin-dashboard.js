

document.addEventListener("DOMContentLoaded", async function () {
  try {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      console.error("No userId found in localStorage");
      return;
    }

    await window.dbReady;

    const img = document.getElementById("user-img");

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
