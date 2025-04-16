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

    console.log("User data from IndexedDB:", dataArray);

    const data = Array.isArray(dataArray) ? dataArray[0] : dataArray;

    if (data && data.userImg) {
      img.src = data.userImg;
    } else {
      console.warn("No userImg found for this user.");
    }
  } catch (err) {
    console.error("Failed to get user data from IndexedDB", err);
  }
});
