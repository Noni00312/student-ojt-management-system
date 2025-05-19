import { firebaseCRUD } from "./firebase-crud.js";

document.addEventListener("DOMContentLoaded", async function () {
  try {
    const companies = await firebaseCRUD.getAllData("company");

    if (!companies || companies.length === 0) {
      console.warn("No data found in Firestore.");
      return;
    }

    await window.dbReady;

    const existingCompanies = await crudOperations.getAllData("companyTbl");
    if (existingCompanies && existingCompanies.length > 0) {
      await crudOperations.clearTable("companyTbl");
      // console.log("Existing companyTbl data cleared.");
    }

    // Populate new data
    for (const company of companies) {
      await crudOperations.createData("companyTbl", company);
    }

    await DisplayCompanies();
    setupCompanySelectListener();
    // console.log("Companies cached to IndexedDB:", companies);
  } catch (err) {
    console.error("Failed to fetch and cache companies:", err);
  }
});

async function DisplayCompanies() {
  const selectCompany = document.getElementById("company-name");

  selectCompany.innerHTML =
    "<option value='' disabled selected>Select a company</option>";

  try {
    const companies = await crudOperations.getAllData("companyTbl");

    if (!companies || companies.length === 0) {
      console.warn("No companies found in IndexedDB.");
      return;
    }

    for (const company of companies) {
      const option = document.createElement("option");
      option.value = company.companyName;
      option.textContent = company.companyName;
      selectCompany.appendChild(option);
    }
  } catch (err) {
    console.error("Failed to load companies from IndexedDB:", err);
  }
}

function setupCompanySelectListener() {
  const selectCompany = document.getElementById("company-name");
  const addressInput = document.getElementById("company-address");
  const provinceInput = document.getElementById("company-province");

  selectCompany.addEventListener("change", async function () {
    const selectedName = this.value;

    try {
      const companies = await crudOperations.getAllData("companyTbl");
      const selectedCompany = companies.find(
        (company) => company.companyName === selectedName
      );

      if (selectedCompany) {
        addressInput.value = selectedCompany.companyAddress || "";
        provinceInput.value = selectedCompany.companyProvince || "";
      } else {
        addressInput.value = "";
        provinceInput.value = "";
        console.warn("Selected company not found in IndexedDB.");
      }
    } catch (err) {
      console.error("Failed to fetch company address:", err);
    }
  });
}
