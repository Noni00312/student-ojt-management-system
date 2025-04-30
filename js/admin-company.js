
function showLoading(show) {
    const loader = document.getElementById("loading-indicator") || createLoader();
    if (loader) {
      loader.style.display = show ? "block" : "none";
    }
  }
  
  function createLoader() {
    try {
      const loader = document.createElement("div");
      loader.id = "loading-indicator";
      loader.className = "text-center py-4";
      loader.innerHTML =
        '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
      
      
      const container = document.querySelector(".card-container") || 
                       document.querySelector(".company-container") ||
                       document.body;
      
      if (container) {
        container.prepend(loader);
        return loader;
      }
      return null;
    } catch (error) {
      console.error("Error creating loader:", error);
      return null;
    }
  }
  

function showError(message) {
    const container = document.querySelector(".card-container") || document.body;
    
    
    container.innerHTML = `
        <div class="d-flex justify-content-center align-items-center" style="min-height: 50vh;">
            <div class="text-center">
                <i class="bi bi-exclamation-triangle-fill fs-1 text-danger"></i>
                <p class="mt-3 fs-5">${message}</p>
                <button class="btn btn-primary mt-3" onclick="location.reload()">Retry</button>
            </div>
        </div>
    `;
}
  
  
  function debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
          const later = () => {
              clearTimeout(timeout);
              func(...args);
          };
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
      };
  }
  
  function loadCompanies() {
      showLoading(true);
      import("./firebase-crud.js")
          .then(({ firebaseCRUD }) => {
              firebaseCRUD.getAllData("company")
                  .then((companies) => {
                      displayCompanies(companies);
                      showLoading(false);
                  })
                  .catch((error) => {
                      console.error("Error loading companies:", error);
                      showError("Failed to load companies: " + error.message);
                      showLoading(false);
                  });
          })
          .catch((err) => {
              console.error("Failed to load firebase-crud:", err);
              showError("Failed to load required modules");
              showLoading(false);
          });
  }
  
  function displayCompanies(companies) {
      const cardContainer = document.querySelector('.card-container');
      if (!cardContainer) {
          console.error("Card container not found");
          return;
      }
      
      cardContainer.innerHTML = ''; 
  
      if (!companies || companies.length === 0) {
          cardContainer.innerHTML = `
            <div class="position-absolute top-50 start-50 translate-middle col-12 text-center py-4">
                <i class="bi bi-exclamation-circle fs-1 text-muted"></i>
                <h6 class="mt-2">No Companies Available</h6>
                <p class="mt-1">No companies have been registered yet.</p>
            </div>
        `;
          return;
      }
  
      companies.forEach((company) => {
          const colDiv = document.createElement('div');
          colDiv.className = 'col-lg-4 col-md-6';
  
          colDiv.innerHTML = `
        <div class="company-card">
          <div class="company-image-container">
            ${company.image ?
                  `<img src="${company.image}" alt="${company.companyName}" class="company-image">` :
                  `<div class="no-image-placeholder"><i class="bi bi-building"></i></div>`
              }
          </div>
          <div class="company-overlay"></div>
          <div class="company-content">
            <div class="company-info">
              <p class="d-none">${company.id || ''}</p>
              <h5>${company.companyName || 'No name'}</h5>
              <p>${company.companyAddress || 'No address'}</p>
            </div>
            <button class="edit-btn" data-bs-toggle="modal" data-bs-target="#updateCompanyModal" data-id="${company.id}">
              <i class="bi bi-pencil"></i>
            </button>
          </div>
        </div>
      `;
  
          cardContainer.appendChild(colDiv);
      });
  
      
      document.querySelectorAll('.edit-btn').forEach(button => {
          button.addEventListener('click', function () {
              const companyId = this.getAttribute('data-id');
              loadCompanyDataForUpdate(companyId);
          });
      });
  }
  
  function searchCompanies(searchTerm) {
      showLoading(true);
      import("./firebase-crud.js")
          .then(({ firebaseCRUD }) => {
              firebaseCRUD.getDataById("company", "companyName", "==", searchTerm)
                  .then((companies) => {
                      const filtered = companies.filter(company =>
                          company.companyName &&
                          company.companyName.toLowerCase().includes(searchTerm.toLowerCase())
                      );
                      displayCompanies(filtered);
                      showLoading(false);
                  })
                  .catch((error) => {
                      console.error("Error with search, falling back to client-side filtering:", error);
                      firebaseCRUD.getAllData("company")
                          .then((allCompanies) => {
                              const filtered = allCompanies.filter(company =>
                                  company.companyName &&
                                  company.companyName.toLowerCase().includes(searchTerm.toLowerCase())
                              );
                              displayCompanies(filtered);
                              showLoading(false);
                          })
                          .catch(fallbackError => {
                              console.error("Fallback also failed:", fallbackError);
                              showError("Failed to search companies");
                              showLoading(false);
                          });
                  });
          })
          .catch((err) => {
              console.error("Failed to load firebase-crud:", err);
              showError("Failed to load required modules");
              showLoading(false);
          });
  }
  
  function loadCompanyDataForUpdate(companyId) {
      showLoading(true);
      import("./firebase-crud.js")
          .then(({ firebaseCRUD }) => {
              firebaseCRUD.getDataById("company", companyId)
                  .then((company) => {
                      const updateModal = document.getElementById('updateCompanyModal');
                      const nameInput = updateModal.querySelector('[name="companyNameU"]');
                      const addressInput = updateModal.querySelector('[name="companyAddressU"]');
                      const previewImage = updateModal.querySelector('#update-preview-image');
                      const cameraIcon = updateModal.querySelector('#update-camera-icon');
  
                      if (!nameInput || !addressInput || !previewImage || !cameraIcon) {
                          throw new Error("Required form elements not found");
                      }
  
                      nameInput.value = company.companyName || '';
                      addressInput.value = company.companyAddress || '';
  
                      if (company.image) {
                          previewImage.src = company.image;
                          previewImage.style.display = 'block';
                          cameraIcon.style.display = 'none';
                      } else {
                          previewImage.style.display = 'none';
                          cameraIcon.style.display = 'block';
                      }
  
                      updateModal.setAttribute('data-company-id', companyId);
                      showLoading(false);
                  })
                  .catch((error) => {
                      console.error("Error loading company data:", error);
                      showErrorToast("Failed to load company data: " + error.message);
                      showLoading(false);
                  });
          })
          .catch((err) => {
              console.error("Failed to load firebase-crud:", err);
              showErrorToast("Failed to load required modules");
              showLoading(false);
          });
  }
  
  function showErrorToast(message) {
      const toast = document.createElement('div');
      toast.className = 'toast align-items-center text-white bg-success position-fixed bottom-0 end-0 m-3';
      toast.innerHTML = `
          <div class="d-flex">
              <div class="toast-body">${message}</div>
              <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
          </div>
      `;
      document.body.appendChild(toast);
      new bootstrap.Toast(toast).show();
      setTimeout(() => toast.remove(), 5000);
  }
  
  $(document).ready(function () {
      loadCompanies();
  
      const debouncedSearch = debounce(function () {
          const searchTerm = $("#companySearch").val().trim();
          if (searchTerm.length > 0) {
              searchCompanies(searchTerm);
          } else {
              loadCompanies();
          }
      }, 300);
  
      $("#companySearch").on("input", debouncedSearch);
  
      async function checkCompanyNameExists(companyName) {
          try {
              const { firebaseCRUD } = await import("./firebase-crud.js");
              const companies = await firebaseCRUD.getAllData("company");
              return companies.some(company =>
                  company.companyName &&
                  company.companyName.toLowerCase() === companyName.toLowerCase()
              );
          } catch (error) {
              console.error("Error checking company name:", error);
              return true;
          }
      }
  
      $("#ojtForm").validate({
          rules: {
              companyName: {
                  required: true,
                  minlength: 2,
              },
              companyAddress: {
                  required: true,
                  minlength: 2,
              },
          },
          errorPlacement: function (error, element) {
              error.appendTo($("#" + element.attr("name") + "-error"));
          },
          submitHandler: function (form) {
              const submitButton = $(form).find('button[type="submit"]');
              const companyName = form.companyName.value.trim();
  
              submitButton.prop("disabled", true);
              submitButton.html(`
                  <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  Checking...
              `);
  
              checkCompanyNameExists(companyName)
                  .then(nameExists => {
                      if (nameExists) {
                          showErrorToast("A company with this name already exists!");
                          return Promise.reject("Duplicate company name");
                      }
  
                      submitButton.html(`
                          <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          Adding Company...
                      `);
  
                      const companyData = {
                          companyName: companyName,
                          companyAddress: form.companyAddress.value,
                          image: uploadedImageBase64 || "",
                          createdAt: new Date().toISOString()
                      };
  
                      return import("./firebase-crud.js")
                          .then(({ firebaseCRUD }) => {
                              return firebaseCRUD.createData("company", companyData);
                          });
                  })
                  .then(() => {
                      showErrorToast("Company added successfully!");
                      form.reset();
                      document.getElementById("preview-image").src = "";
                      document.getElementById("preview-image").style.display = "none";
                      document.getElementById("camera-input").value = "";
                      uploadedImageBase64 = "";
                      loadCompanies();
                  })
                  .catch((error) => {
                      if (error !== "Duplicate company name") {
                          console.error("Error:", error);
                          showErrorToast(`Operation failed: ${error.message}`);
                      }
                  })
                  .finally(() => {
                      submitButton.prop("disabled", false).text("Add Company");
                  });
          },
      });
  });
  
  
  document.addEventListener('DOMContentLoaded', function () {
      const updateCameraInput = document.getElementById('update-camera-input');
      if (updateCameraInput) {
          updateCameraInput.addEventListener('change', function (event) {
              const file = event.target.files[0];
              const previewImage = document.getElementById('update-preview-image');
              const cameraIcon = document.getElementById('update-camera-icon');
  
              if (file && previewImage && cameraIcon) {
                  const reader = new FileReader();
                  reader.onload = function (e) {
                      previewImage.src = e.target.result;
                      previewImage.style.display = 'block';
                      cameraIcon.style.display = 'none';
                      uploadedImageBase64 = e.target.result;
                  };
                  reader.readAsDataURL(file);
              }
          });
      }
  });
  
  $("#ojtFormU").validate({
      rules: {
          companyNameU: {
              required: true,
              minlength: 2,
          },
          companyAddressU: {
              required: true,
              minlength: 2,
          },
      },
      messages: {
          companyNameU: {
              required: "Please enter company name",
              minlength: "Company name must be at least 2 characters long",
          },
          companyAddressU: {
              required: "Please enter company address",
              minlength: "Company address must be at least 2 characters long",
          },
      },
      errorPlacement: function (error, element) {
          error.appendTo($("#" + element.attr("name") + "-error"));
      },
      submitHandler: function (form, event) {
          event.preventDefault();
  
          const submitButton = $(form).find('button[type="submit"]');
          const companyId = document.getElementById('updateCompanyModal')?.getAttribute('data-company-id');
          const previewImage = document.querySelector('#updateCompanyModal #update-preview-image');
          const newCompanyName = form.companyNameU.value.trim();
          const newCompanyAddress = form.companyAddressU.value.trim();
  
          if (!companyId) {
              showErrorToast("Company ID not found");
              submitButton.prop("disabled", false).text("Update Company");
              return;
          }
  
          submitButton.prop("disabled", true).html(`
              <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              Checking...
          `);
  
          checkCompanyDuplicate(newCompanyName, newCompanyAddress, companyId)
              .then(duplicateExists => {
                  if (duplicateExists) {
                      showErrorToast("A company with this name and address already exists!");
                      return Promise.reject("Duplicate company");
                  }
  
                  submitButton.html(`
                      <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      Updating...
                  `);
  
                  const companyData = {
                      companyName: newCompanyName,
                      companyAddress: newCompanyAddress,
                      updatedAt: new Date().toISOString()
                  };
  
                  if (uploadedImageBase64) {
                      companyData.image = uploadedImageBase64;
                  } else if (previewImage?.src && previewImage.style.display !== 'none') {
                      
                  } else {
                      companyData.image = "";
                  }
  
                  return import("./firebase-crud.js")
                      .then(({ firebaseCRUD }) => {
                          return firebaseCRUD.updateData("company", companyId, companyData);
                      });
              })
              .then(() => {
                  showErrorToast("Company updated successfully!");
                  form.reset();
                  const modal = bootstrap.Modal.getInstance(document.getElementById('updateCompanyModal'));
                  modal?.hide();
  
                  if (previewImage) {
                      previewImage.src = '';
                      previewImage.style.display = 'none';
                  }
                  const cameraIcon = document.querySelector('#updateCompanyModal #camera-icon');
                  if (cameraIcon) {
                      cameraIcon.style.display = 'block';
                  }
                  uploadedImageBase64 = "";
                  loadCompanies();
              })
              .catch((error) => {
                  if (error !== "Duplicate company") {
                      console.error("Update error:", error);
                      showErrorToast(`Update failed: ${error.message}`);
                  }
              })
              .finally(() => {
                  submitButton.prop("disabled", false).text("Update Company");
              });
      }
  });
  
  async function checkCompanyDuplicate(companyName, companyAddress, excludeId = null) {
      try {
          const { firebaseCRUD } = await import("./firebase-crud.js");
          const companies = await firebaseCRUD.getAllData("company");
  
          return companies.some(company => {
              const nameMatches = company.companyName &&
                  company.companyName.toLowerCase() === companyName.toLowerCase();
              const addressMatches = company.companyAddress &&
                  company.companyAddress.toLowerCase() === companyAddress.toLowerCase();
              const isSameCompany = excludeId && company.id === excludeId;
              return nameMatches && addressMatches && !isSameCompany;
          });
      } catch (error) {
          console.error("Error checking company:", error);
          return true;
      }
  }
  
  document.getElementById('updateCompanyModal')?.addEventListener('hidden.bs.modal', function () {
      const form = document.getElementById('ojtFormU');
      const previewImage = document.querySelector('#updateCompanyModal #update-preview-image');
      const cameraIcon = document.querySelector('#updateCompanyModal #camera-icon');
      const cameraInput = document.getElementById('update-camera-input');
  
      if (form) form.reset();
      if (previewImage) {
          previewImage.src = '';
          previewImage.style.display = 'none';
      }
      if (cameraIcon) cameraIcon.style.display = 'block';
      if (cameraInput) cameraInput.value = '';
      uploadedImageBase64 = "";
  });