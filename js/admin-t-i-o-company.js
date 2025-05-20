window.document.addEventListener("DOMContentLoaded", async () => {
  try {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      console.error("No userId found in localStorage");
      return;
    }

    await window.dbReady;

    const img = document.getElementById("user-profile");

    const dataArray = await crudOperations.getByIndex(
      "studentInfoTbl",
      "userId",
      userId
    );

    const data = Array.isArray(dataArray) ? dataArray[0] : dataArray;

    img.src = data.userImg
      ? data.userImg
      : "../assets/img/icons8_male_user_480px_1";

    try {
      showLoading(true);
      const companyName = await getAllByCompanyName();
    } catch (error) {
      console.error("Error loading history:", error);
      showError("Failed to load history. Please try again later.");
    } finally {
      showLoading(false);
    }
  } catch (err) {
    console.error("Failed to get user data from IndexedDB", err);
  }
});

let allCompanyDataList = [];

document.getElementById("company-search").addEventListener("input", (e) => {
  const searchTerm = e.target.value.toLowerCase();

  if (!searchTerm) {
    populateDates(allCompanyDataList);
    return;
  }

  const filteredCompanies = allCompanyDataList.filter((company) =>
    company.companyName.toLowerCase().includes(searchTerm)
  );

  populateDates(filteredCompanies);
});

function filterDatesBySearch(searchDate, allDates) {
  if (!searchDate) {
    populateDates(allDates);
    return;
  }

  const filteredDates = allDates.filter((dateInfo) => {
    return dateInfo.rawDate === searchDate;
  });

  populateDates(filteredDates);
}

async function getAllByCompanyName() {
  const container = document.querySelector(".card-container .row");
  container.innerHTML = "";

  try {
    const { firebaseCRUD } = await import("./firebase-crud.js");
    const urlParams = new URLSearchParams(window.location.search);
    const date = urlParams.get("date");

    const data = await firebaseCRUD.queryData(
      "completeAttendanceTbl",
      "date",
      "==",
      date
    );

    if (!Array.isArray(data) || data.length === 0) {
      populateDates([]);
      return;
    }

    const companyGroups = {};
    for (const record of data) {
      const name = record.companyName;
      if (!companyGroups[name]) {
        companyGroups[name] = {
          companyName: name,
          companyAddress: record.companyAddress,
          present: 0,
          late: 0,
          absent: 0,
          users: [],
        };
      }

      if (record.isPresent) {
        companyGroups[name].present++;
        if (record.isLate === true || typeof record.isLate === "undefined") {
          companyGroups[name].late++;
        }
      } else {
        companyGroups[name].absent++;
      }

      companyGroups[name].users.push(record.userId);
    }

    const companyDataList = [];
    for (const companyName in companyGroups) {
      const group = companyGroups[companyName];

      const imageQuery = await firebaseCRUD.queryData(
        "company",
        "companyName",
        "==",
        companyName.trim()
      );

      const imageUrl = imageQuery?.[0]?.image || "../assets/img/OC.jpg";

      companyDataList.push({
        companyName: group.companyName,
        companyAddress: group.companyAddress,
        image: imageUrl,
        present: group.present,
        late: group.late,
        absent: group.absent,
        date: date,
        users: group.users,
      });
    }

    allCompanyDataList = companyDataList;
    populateDates(companyDataList);
  } catch (error) {
    console.error("Error fetching company attendance data:", error);
    container.innerHTML = `<p class="text-danger">Failed to fetch data: ${error.message}</p>`;
  }
}

function showLoading(show) {
  const loader = document.getElementById("loading-indicator") || createLoader();
  loader.style.display = show ? "block" : "none";
}

function createLoader() {
  const loader = document.createElement("div");
  loader.id = "loading-indicator";
  loader.className = "text-center py-4";
  loader.innerHTML =
    '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
  document.querySelector(".card-container").prepend(loader);
  return loader;
}
function populateDates(companyDataList) {
  const container = document.querySelector(".card-container .row");
  container.innerHTML = "";

  if (companyDataList.length === 0) {
    container.innerHTML = `<div class="position-absolute top-50 start-50 translate-middle align-items-center col-12 text-center py-4">
                <i class="bi bi-exclamation-circle fs-1 text-muted"></i>
                <h6 class="mt-2">No Company Found For This Date</h6>
                <p class="mt-1 text-muted">Oops! No matching results found. Try searching with a different company name.</p>
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
