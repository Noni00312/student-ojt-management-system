window.document.addEventListener("DOMContentLoaded", async () => {
  await window.dbReady;
  const urlParams = new URLSearchParams(window.location.search);
  const date = urlParams.get("date");
  const companyName = urlParams.get("company-name");

  await loadStudent(`${companyName}_${date}`);

  // console.log("Date:", date);
  // console.log("Company Name:", companyName);

  // const userId = localStorage.getItem("userId");
  // if (!userId) {
  //   const overlay = document.getElementById("page-loading-overlay");
  //   if (overlay) overlay.style.display = "none";
  //   return;
  // }

  // const overlay = document.getElementById("page-loading-overlay");
  // if (overlay) {
  //   overlay.style.opacity = "0";
  //   setTimeout(() => {
  //     overlay.style.display = "none";
  //   }, 300);
  // }
});

async function loadStudent(companyUserIdData) {
  const userIds = crudOperations
    .getData("companyUsersTbl", companyUserIdData)
    .then((record) => {
      if (record) {
        return record.users;
      } else {
        console.log("No matching record found.");
        return [];
      }
    })
    .catch((err) => {
      console.error("Error fetching record:", err);
      return [];
    });

  const { firebaseCRUD } = await import("./firebase-crud.js");

  userIds.forEach((userId) => {
    firebaseCRUD.queryData("studentInfoTbl", "userId", "==", userId);
  });
}

function populateDates(companyDataList) {
  const container = document.querySelector(".card-container .row");
  container.innerHTML = "";

  if (companyDataList.length === 0) {
    container.innerHTML = `<div class="position-absolute top-50 start-50 translate-middle align-items-center col-12 text-center py-4">
                <i class="bi bi-exclamation-circle fs-1 text-muted"></i>
                <h6 class="mt-2">No Company Found For This Date</h6>
                <p class="mt-1">Oops! There’s no data for this date. Try picking another day from the calendar.</p>
            </div>`;
    return;
  }

  companyDataList.forEach((company) => {
    const {
      companyName,
      companyAddress,
      image,
      present,
      late,
      absent,
      date,
      users,
    } = company;
    crudOperations.clearTable("companyUsersTbl");
    crudOperations.upsert("companyUsersTbl", {
      id: `${companyName}_${date}`,
      companyName,
      date,
      users,
      image,
      present,
      late,
      absent,
    });
    const card = document.createElement("div");
    card.className = "col-12 col-md-6 col-lg-4 mb-2 p-2";

    card.innerHTML = `
      <a
      href="#"
      class="company-card mb-2"
      
    >
      <div class="company-img-name-container">
        <img src="${image}" alt="${companyName}" />
        <div class="text">
          <h3>${companyName}</h3>
          <small>${companyAddress}</small>
        </div>

        <div class="bottom-container">
          <div class="indicators">
            <span class="flex">
              <span id="present" class="box"></span>
              <p>${present}</p>
            </span>
            <span class="flex">
              <span id="late" class="box"></span>
              <p>${late}</p>
            </span>
            <span class="flex">
              <span id="absent" class="box"></span>
              <p>${absent}</p>
            </span>
          </div>
          <button class="view-button" data-date="${date}" data-company-name="${companyName}">
            <i class="bi bi-eye-fill fs-4"></i>
          </button>
        </div>
      </div>
    </a>
    `;

    container.appendChild(card);

    card.querySelector(".view-button").addEventListener("click", (e) => {
      e.preventDefault();
      const selectedDate = e.currentTarget.getAttribute("data-date");
      const selectedCompanyName =
        e.currentTarget.getAttribute("data-company-name");

      window.location.href = `admin-t-i-o-students.html?date=${selectedDate}&company-name=${encodeURIComponent(
        selectedCompanyName
      )}`;
    });
  });
}
