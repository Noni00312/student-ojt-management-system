
// Add this utility function at the top of your admin-company.js
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
    import("./firebase-crud.js")
        .then(({ firebaseCRUD }) => {
            firebaseCRUD.getAllData("company")
                .then((companies) => {
                    displayCompanies(companies);
                })
                .catch((error) => {
                    console.error("Error loading companies:", error);
                    alert("Failed to load companies: " + error.message);
                });
        })
        .catch((err) => {
            console.error("Failed to load firebase-crud:", err);
        });
}

// Function to display companies
function displayCompanies(companies) {
    const cardContainer = document.querySelector('.card-container');
    cardContainer.innerHTML = ''; // Clear existing content

    if (!companies || companies.length === 0) {
        cardContainer.innerHTML = '<p class="text-center">No companies found</p>';
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

    // Add event listeners to all edit buttons
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', function () {
            const companyId = this.getAttribute('data-id');
            loadCompanyDataForUpdate(companyId);
        });
    });
}



function searchCompanies(searchTerm) {
    console.log("Searching for:", searchTerm); // Debug log

    import("./firebase-crud.js")
        .then(({ firebaseCRUD }) => {
            console.log("Firebase CRUD loaded"); // Debug log

            firebaseCRUD.getDataById("company", "companyName", "==", searchTerm)
                .then((companies) => {
                    console.log("Initial results:", companies); // Debug log

                    // For more flexible matching, filter client-side
                    const filtered = companies.filter(company =>
                        company.companyName &&
                        company.companyName.toLowerCase().includes(searchTerm.toLowerCase())
                    );

                    console.log("Filtered results:", filtered); // Debug log
                    displayCompanies(filtered);
                })
                .catch((error) => {
                    console.error("Error with search, falling back to client-side filtering:", error);

                    // Fallback to client-side filtering if search fails
                    firebaseCRUD.getAllData("company")
                        .then((allCompanies) => {
                            const filtered = allCompanies.filter(company =>
                                company.companyName &&
                                company.companyName.toLowerCase().includes(searchTerm.toLowerCase())
                            );
                            displayCompanies(filtered);
                        })
                        .catch(fallbackError => {
                            console.error("Fallback also failed:", fallbackError);
                        });
                });
        })
        .catch((err) => {
            console.error("Failed to load firebase-crud:", err);
        });
}




function loadCompanyDataForUpdate(companyId) {
    import("./firebase-crud.js")
        .then(({ firebaseCRUD }) => {
            firebaseCRUD.getDataById("company", companyId)
                .then((company) => {
                    // Get references to the update modal elements
                    const updateModal = document.getElementById('updateCompanyModal');
                    const nameInput = updateModal.querySelector('[name="companyNameU"]');
                    const addressInput = updateModal.querySelector('[name="companyAddressU"]');
                    const previewImage = updateModal.querySelector('#update-preview-image');
                    const cameraIcon = updateModal.querySelector('#update-camera-icon');

                    // Check if elements exist before manipulating them
                    if (!nameInput || !addressInput || !previewImage || !cameraIcon) {
                        throw new Error("Required form elements not found");
                    }

                    // Populate the form
                    nameInput.value = company.companyName || '';
                    addressInput.value = company.companyAddress || '';

                    // Handle the image
                    if (company.image) {
                        previewImage.src = company.image;
                        previewImage.style.display = 'block';
                        cameraIcon.style.display = 'none';
                    } else {
                        previewImage.style.display = 'none';
                        cameraIcon.style.display = 'block';
                    }

                    // Store the company ID in the modal
                    updateModal.setAttribute('data-company-id', companyId);
                })
                .catch((error) => {
                    console.error("Error loading company data:", error);
                    alert("Failed to load company data: " + error.message);
                });
        })
        .catch((err) => {
            console.error("Failed to load firebase-crud:", err);
        });
}







$(document).ready(function () {
    loadCompanies();

    // Debounce the search function to wait 300ms after typing stops
    const debouncedSearch = debounce(function () {
        const searchTerm = $("#companySearch").val().trim();
        if (searchTerm.length > 0) {
            searchCompanies(searchTerm);
        } else {
            loadCompanies();
        }
    }, 300);

    $("#companySearch").on("input", debouncedSearch);



    $("#ojtForm").validate({
        rules: {
            companyName: {
                required: true,
                minlength: 2,
            },
            companyAddress: {
                required: true,
                minlength: 2,
                // maxlength: 15,
            },

        },
        errorPlacement: function (error, element) {
            error.appendTo($("#" + element.attr("name") + "-error"));
        },
        submitHandler: function (form) {
            const submitButton = $(form).find('button[type="submit"]');

            submitButton.prop("disabled", true);
            submitButton.html(`
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Adding Company...
      `);

            const companyData = {
                // userId: form.userId.value,
                // userType: form.userType.value,
                companyName: form.companyName.value,
                companyAddress: form.companyAddress.value,
                // image: uploadedImageBase64 || "", // Store the image as a string
                image: uploadedImageBase64 || "",
                createdAt: new Date().toISOString()

            };

            import("./firebase-crud.js")
                .then(({ firebaseCRUD }) => {
                    firebaseCRUD
                        .createData("company", companyData)
                        .then(() => {
                            alert("Successfully Inserted!");
                            // window.location.href = "../pages/login.html";
                            form.reset();
                            document.getElementById("company-name").value = "";
                            document.getElementById("company-address").value = "";
                            document.getElementById("preview-image").src = "";
                            document.getElementById("preview-image").style.display = "none";
                            document.getElementById("camera-input").value = "";
                            uploadedImageBase64 = "";


                            // Refresh the companies list
                            loadCompanies();

                            submitButton.prop("disabled", false);
                            submitButton.text("Add Company");

                        })
                        .catch((error) => {
                            console.error("Insertion error:", error);
                            alert(`Registration failed: ${error.message}`);

                            submitButton.prop("disabled", false);
                            submitButton.text("Add Company");
                        });
                })
                .catch((err) => {
                    console.error("Failed to load firebase-crud:", err);
                    submitButton.prop("disabled", false);
                    submitButton.text("Add Company");
                });
        },
    });
});



// Update modal image handling
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


// Update modal image handling
document.getElementById('update-camera-input').addEventListener('change', function (event) {
    const file = event.target.files[0];
    const previewImage = document.getElementById('update-preview-image');
    const cameraIcon = document.getElementById('update-camera-icon');

    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            previewImage.src = e.target.result;
            previewImage.style.display = 'block';
            if (cameraIcon) cameraIcon.style.display = 'none';
            uploadedImageBase64 = e.target.result; // Save Base64 image
        };
        reader.readAsDataURL(file);
    }
});




$(document).ready(function () {
    // ... your existing code ...

    // Update form submission
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
        submitHandler: function (form) {
            const submitButton = $(form).find('button[type="submit"]');
            const companyId = document.getElementById('updateCompanyModal').getAttribute('data-company-id');

            submitButton.prop("disabled", true);
            submitButton.html(`
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Updating...
            `);

            const companyData = {
                companyName: form.companyNameU.value,
                companyAddress: form.companyAddressU.value,
                image: uploadedImageBase64 || document.querySelector('#updateCompanyModal #preview-image').src || "",
                updatedAt: new Date().toISOString()
            };

            import("./firebase-crud.js")
                .then(({ firebaseCRUD }) => {
                    firebaseCRUD.updateData("company", companyId, companyData)
                        .then(() => {
                            alert("Company updated successfully!");

                            // Reset the form and close modal
                            form.reset();
                            const modal = bootstrap.Modal.getInstance(document.getElementById('updateCompanyModal'));
                            modal.hide();

                            // Refresh the companies list
                            loadCompanies();

                            submitButton.prop("disabled", false);
                            submitButton.text("Update Company");
                        })
                        .catch((error) => {
                            console.error("Update error:", error);
                            alert(`Update failed: ${error.message}`);

                            submitButton.prop("disabled", false);
                            submitButton.text("Update Company");
                        });
                })
                .catch((err) => {
                    console.error("Failed to load firebase-crud:", err);
                    submitButton.prop("disabled", false);
                    submitButton.text("Update Company");
                });
        }
    });

    // Reset the form when modal is closed
    document.getElementById('updateCompanyModal').addEventListener('hidden.bs.modal', function () {
        document.getElementById('ojtFormU').reset();
        document.querySelector('#updateCompanyModal #preview-image').style.display = 'none';
        document.querySelector('#updateCompanyModal #camera-icon').style.display = 'block';
        uploadedImageBase64 = "";
    });
});










// $(document).ready(function () {
//     $("#ojtFormU").validate({
//         rules: {
//             // companyName: {
//             //     required: true,
//             //     minlength: 2,
//             // },
//             // companyAddress: {
//             //     required: true,
//             //     digits: true,
//             //     minlength: 2,
//             //     // maxlength: 15,
//             // },
//             companyNameU: {
//                 required: true,
//                 minlength: 2,
//             },
//             companyAddressU: {
//                 required: true,
//                 minlength: 2,
//             },

//         },
//         message: {
//             companyNameU: {
//                 required: "Please enter your comapany name",
//                 minlength: "Your company name must be at least 2 characters long",
//             },
//             companyAddressU: {
//                 required: "Please enter your company address",
//                 digits: "Please enter a valid phone number",
//                 minlength: "Your phone company address must be at least 2 characters long",
//                 // maxlength: "Your phone number must be at most 15 digits long",
//             },

//         },
//         errorPlacement: function (error, element) {
//             error.appendTo($("#" + element.attr("name") + "-error"));
//         },
//         submitHandler: function (form) {
//             const submitButton = $(form).find('button[type="submit"]');

//             submitButton.prop("disabled", true);
//             submitButton.html(`
//         <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
//         Updating Company...
//       `);

//             const studentData = {
//                 // userId: form.userId.value,
//                 userType: form.userType.value,
//                 studentId: form.studentId.value,
//                 phoneNumber: form.phoneNumber.value,
//                 firstName: form.firstName.value,
//                 middleName: form.middleName.value,
//                 lastName: form.lastName.value,
//                 suffix: form.suffix.value,
//                 gender: form.gender.value,
//                 address: form.address.value,
//                 companyName: form.companyName.value,
//                 // companyAddress : form.companyAddress.value,
//                 morningTimeIn: form.morningTimeIn.value,
//                 morningTimeOut: form.morningTimeOut.value,
//                 afternoonTimeIn: form.afternoonTimeIn.value,
//                 afternoonTimeOut: form.afternoonTimeOut.value,
//                 createdAt: new Date().toISOString(),
//                 updatedAt: new Date().toISOString(),
//             };

//             import("./firebase-crud.js")
//                 .then(({ firebaseCRUD }) => {
//                     firebaseCRUD
//                         .createStudent(studentData)
//                         .then(() => {
//                             alert("Registration successful!");
//                             window.location.href = "../pages/login.html";
//                         })
//                         .catch((error) => {
//                             console.error("Registration error:", error);
//                             alert(`Registration failed: ${error.message}`);

//                             submitButton.prop("disabled", false);
//                             submitButton.text("Create account");
//                         });
//                 })
//                 .catch((err) => {
//                     console.error("Failed to load firebase-crud:", err);
//                     submitButton.prop("disabled", false);
//                     submitButton.text("Create account");
//                 });
//         },
//     });
// });








// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>





// function loadCompanies() {
//     import("./firebase-crud.js")
//         .then(({ firebaseCRUD }) => {
//             firebaseCRUD.getAllData("company")
//                 .then((companies) => {
//                     displayCompanies(companies);
//                 })
//                 .catch((error) => {
//                     console.error("Error loading companies:", error);
//                     alert("Failed to load companies: " + error.message);
//                 });
//         })
//         .catch((err) => {
//             console.error("Failed to load firebase-crud:", err);
//         });
// }

// // Function to display companies
// function displayCompanies(companies) {
//     const cardContainer = document.querySelector('.card-container');
//     cardContainer.innerHTML = ''; // Clear existing content

//     if (!companies || companies.length === 0) {
//         cardContainer.innerHTML = '<p class="text-center">No companies found</p>';
//         return;
//     }

//     companies.forEach((company) => {
//         const colDiv = document.createElement('div');
//         colDiv.className = 'col-lg-4 col-md-6';

//         colDiv.innerHTML = `
//       <div class="company-card">
//         <div class="company-image-container">
//           ${company.image ?
//                 `<img src="${company.image}" alt="${company.companyName}" class="company-image">` :
//                 `<div class="no-image-placeholder"><i class="bi bi-building"></i></div>`
//             }
//         </div>
//         <div class="company-overlay"></div>
//         <div class="company-content">
//           <div class="company-info">
//             <h5>${company.companyName || 'No name'}</h5>
//             <p>${company.companyAddress || 'No address'}</p>
//           </div>
//           <button class="edit-btn" data-bs-toggle="modal" data-bs-target="#updateCompanyModal" data-id="${company.id}">
//             <i class="bi bi-pencil"></i>
//           </button>
//         </div>
//       </div>
//     `;

//         cardContainer.appendChild(colDiv);
//     });
// }



// $(document).ready(function () {
//     loadCompanies();
//     $("#ojtForm").validate({
//         rules: {
//             companyName: {
//                 required: true,
//                 minlength: 2,
//             },
//             companyAddress: {
//                 required: true,
//                 minlength: 2,
//                 // maxlength: 15,
//             },

//         },
//         errorPlacement: function (error, element) {
//             error.appendTo($("#" + element.attr("name") + "-error"));
//         },
//         submitHandler: function (form) {
//             const submitButton = $(form).find('button[type="submit"]');

//             submitButton.prop("disabled", true);
//             submitButton.html(`
//         <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
//         Registering...
//       `);

//             const companyData = {
//                 // userId: form.userId.value,
//                 // userType: form.userType.value,
//                 companyName: form.companyName.value,
//                 companyAddress: form.companyAddress.value,
//                 // image: uploadedImageBase64 || "", // Store the image as a string
//                 image: uploadedImageBase64 || "",
//                 createdAt: new Date().toISOString()

//             };

//             import("./firebase-crud.js")
//                 .then(({ firebaseCRUD }) => {
//                     firebaseCRUD
//                         .createData("company", companyData)
//                         .then(() => {
//                             alert("Successfully Inserted!");
//                             // window.location.href = "../pages/login.html";
//                             form.reset();
//                             document.getElementById("company-name").value = "";
//                             document.getElementById("company-address").value = "";
//                             document.getElementById("preview-image").src = "";
//                             document.getElementById("preview-image").style.display = "none";
//                             document.getElementById("camera-input").value = "";
//                             uploadedImageBase64 = "";


//                             // Refresh the companies list
//                             loadCompanies();

//                             submitButton.prop("disabled", false);
//                             submitButton.text("Add Company");

//                         })
//                         .catch((error) => {
//                             console.error("Insertion error:", error);
//                             alert(`Registration failed: ${error.message}`);

//                             submitButton.prop("disabled", false);
//                             submitButton.text("Add Company");
//                         });
//                 })
//                 .catch((err) => {
//                     console.error("Failed to load firebase-crud:", err);
//                     submitButton.prop("disabled", false);
//                     submitButton.text("Add Company");
//                 });
//         },
//     });
// });





// $(document).ready(function () {
//     $("#ojtFormU").validate({
//         rules: {
//             // companyName: {
//             //     required: true,
//             //     minlength: 2,
//             // },
//             // companyAddress: {
//             //     required: true,
//             //     digits: true,
//             //     minlength: 2,
//             //     // maxlength: 15,
//             // },
//             companyNameU: {
//                 required: true,
//                 minlength: 2,
//             },
//             companyAddressU: {
//                 required: true,
//                 minlength: 2,
//             },

//         },
//         message: {
//             companyNameU: {
//                 required: "Please enter your comapany name",
//                 minlength: "Your company name must be at least 2 characters long",
//             },
//             companyAddressU: {
//                 required: "Please enter your company address",
//                 digits: "Please enter a valid phone number",
//                 minlength: "Your phone company address must be at least 2 characters long",
//                 // maxlength: "Your phone number must be at most 15 digits long",
//             },

//         },
//         errorPlacement: function (error, element) {
//             error.appendTo($("#" + element.attr("name") + "-error"));
//         },
//         submitHandler: function (form) {
//             const submitButton = $(form).find('button[type="submit"]');

//             submitButton.prop("disabled", true);
//             submitButton.html(`
//         <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
//         Registering...
//       `);

//             const studentData = {
//                 // userId: form.userId.value,
//                 userType: form.userType.value,
//                 studentId: form.studentId.value,
//                 phoneNumber: form.phoneNumber.value,
//                 firstName: form.firstName.value,
//                 middleName: form.middleName.value,
//                 lastName: form.lastName.value,
//                 suffix: form.suffix.value,
//                 gender: form.gender.value,
//                 address: form.address.value,
//                 companyName: form.companyName.value,
//                 // companyAddress : form.companyAddress.value,
//                 morningTimeIn: form.morningTimeIn.value,
//                 morningTimeOut: form.morningTimeOut.value,
//                 afternoonTimeIn: form.afternoonTimeIn.value,
//                 afternoonTimeOut: form.afternoonTimeOut.value,
//                 createdAt: new Date().toISOString(),
//                 updatedAt: new Date().toISOString(),
//             };

//             import("./firebase-crud.js")
//                 .then(({ firebaseCRUD }) => {
//                     firebaseCRUD
//                         .createStudent(studentData)
//                         .then(() => {
//                             alert("Registration successful!");
//                             window.location.href = "../pages/login.html";
//                         })
//                         .catch((error) => {
//                             console.error("Registration error:", error);
//                             alert(`Registration failed: ${error.message}`);

//                             submitButton.prop("disabled", false);
//                             submitButton.text("Create account");
//                         });
//                 })
//                 .catch((err) => {
//                     console.error("Failed to load firebase-crud:", err);
//                     submitButton.prop("disabled", false);
//                     submitButton.text("Create account");
//                 });
//         },
//     });
// });






// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>




//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>


// let uploadedImageBase64 = "";

// // Function to load and display companies
// async function loadCompanies() {
//     try {
//         const { firebaseCRUD } = await import("./firebase-crud.js");
//         const companies = await firebaseCRUD.getAllData("company");
//         displayCompanies(companies);
//     } catch (error) {
//         console.error("Error loading companies:", error);
//         showToast("Failed to load companies: " + error.message, "error");
//     }
// }

// // Function to display companies in the UI
// function displayCompanies(companies) {
//     const cardContainer = document.querySelector('.card-container');
//     cardContainer.innerHTML = ''; // Clear existing content

//     if (!companies || companies.length === 0) {
//         cardContainer.innerHTML = '<p class="text-center">No companies found</p>';
//         return;
//     }

//     companies.forEach((company) => {
//         const colDiv = document.createElement('div');
//         colDiv.className = 'col-lg-4 col-md-6';

//         colDiv.innerHTML = `
//       <div class="mb-3 curved-border-container">
//         <div class="overlay"></div>
//         <div class="content">
//           ${company.image ? `<img src="${company.image}" alt="${company.companyName}" class="company-logo">` : ''}
//           <div class="text-container">
//             <h6>${company.companyName || 'No name'}</h6>
//             <p>${company.companyAddress || 'No address'}</p>
//           </div>
//           <a class="action-button" data-bs-toggle="modal"
//              data-bs-target="#updateCompanyModal" data-id="${company.id}">
//             <i class="bi bi-pencil"></i>
//           </a>
//         </div>
//       </div>
//     `;

//         cardContainer.appendChild(colDiv);
//     });

//     // Add event listeners to edit buttons
//     document.querySelectorAll('.action-button').forEach(button => {
//         button.addEventListener('click', async function () {
//             const companyId = this.getAttribute('data-id');
//             await loadCompanyDataForUpdate(companyId);
//         });
//     });
// }

// // Function to load company data for update
// async function loadCompanyDataForUpdate(companyId) {
//     try {
//         const { firebaseCRUD } = await import("./firebase-crud.js");
//         const company = await firebaseCRUD.getDataById("company", companyId);

//         if (company) {
//             document.querySelector('#updateCompanyModal #company-name').value = company.companyName || '';
//             document.querySelector('#updateCompanyModal #company-address').value = company.companyAddress || '';

//             const previewImage = document.querySelector('#updateCompanyModal #preview-image');
//             const cameraIcon = document.querySelector('#updateCompanyModal #camera-icon');

//             if (company.image) {
//                 previewImage.src = company.image;
//                 previewImage.style.display = 'block';
//                 if (cameraIcon) cameraIcon.style.display = 'none';
//                 uploadedImageBase64 = company.image; // Store current image
//             } else {
//                 previewImage.src = '';
//                 previewImage.style.display = 'none';
//                 if (cameraIcon) cameraIcon.style.display = 'block';
//                 uploadedImageBase64 = '';
//             }

//             // Store the company ID in the form for update
//             document.getElementById('ojtFormU').setAttribute('data-id', companyId);
//         }
//     } catch (error) {
//         console.error("Error loading company data:", error);
//         showToast("Failed to load company data: " + error.message, "error");
//     }
// }

// // Initialize when DOM is loaded
// $(document).ready(function () {
//     // Load companies on page load
//     loadCompanies();

//     // Image upload handler for both modals
//     document.querySelectorAll('[id^="camera-input"]').forEach(input => {
//         input.addEventListener('change', function (event) {
//             const file = event.target.files[0];
//             const modalId = this.closest('.modal').id;
//             const previewImage = document.querySelector(`#${modalId} #preview-image`);
//             const cameraIcon = document.querySelector(`#${modalId} #camera-icon`);

//             if (file) {
//                 const reader = new FileReader();
//                 reader.onload = function (e) {
//                     previewImage.src = e.target.result;
//                     previewImage.style.display = 'block';
//                     if (cameraIcon) cameraIcon.style.display = 'none';
//                     uploadedImageBase64 = e.target.result;
//                 };
//                 reader.readAsDataURL(file);
//             }
//         });
//     });

//     // Add Company Form Validation
//     $("#ojtForm").validate({
//         rules: {
//             companyName: {
//                 required: true,
//                 minlength: 2
//             },
//             companyAddress: {
//                 required: true,
//                 minlength: 2
//             }
//         },
//         messages: {
//             companyName: {
//                 required: "Please enter company name",
//                 minlength: "Company name must be at least 2 characters"
//             },
//             companyAddress: {
//                 required: "Please enter company address",
//                 minlength: "Address must be at least 2 characters"
//             }
//         },
//         errorPlacement: function (error, element) {
//             error.appendTo($("#" + element.attr("name") + "-error"));
//         },
//         submitHandler: async function (form) {
//             const submitButton = $(form).find('button[type="submit"]');

//             submitButton.prop("disabled", true);
//             submitButton.html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Adding...');

//             const companyData = {
//                 companyName: form.companyName.value,
//                 companyAddress: form.companyAddress.value,
//                 image: uploadedImageBase64 || "",
//                 createdAt: new Date().toISOString(),
//                 updatedAt: new Date().toISOString()
//             };

//             try {
//                 const { firebaseCRUD } = await import("./firebase-crud.js");
//                 await firebaseCRUD.createData("company", companyData);

//                 showToast("Company added successfully!", "success");
//                 $('#addCompanyModal').modal('hide');
//                 form.reset();
//                 document.querySelector('#addCompanyModal #preview-image').src = "";
//                 document.querySelector('#addCompanyModal #preview-image').style.display = "none";
//                 document.querySelector('#addCompanyModal #camera-icon').style.display = "block";
//                 uploadedImageBase64 = "";
//                 await loadCompanies();
//             } catch (error) {
//                 console.error("Error adding company:", error);
//                 showToast("Failed to add company: " + error.message, "error");
//             } finally {
//                 submitButton.prop("disabled", false);
//                 submitButton.text("Add Company");
//             }
//         }
//     });

//     // Update Company Form Validation
//     $("#ojtFormU").validate({
//         rules: {
//             companyNameU: {
//                 required: true,
//                 minlength: 2
//             },
//             companyAddressU: {
//                 required: true,
//                 minlength: 2
//             }
//         },
//         messages: {
//             companyNameU: {
//                 required: "Please enter company name",
//                 minlength: "Company name must be at least 2 characters"
//             },
//             companyAddressU: {
//                 required: "Please enter company address",
//                 minlength: "Address must be at least 2 characters"
//             }
//         },
//         errorPlacement: function (error, element) {
//             error.appendTo($("#" + element.attr("name") + "-error"));
//         },
//         submitHandler: async function (form) {
//             const submitButton = $(form).find('button[type="submit"]');
//             const companyId = form.getAttribute('data-id');

//             submitButton.prop("disabled", true);
//             submitButton.html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Updating...');

//             const companyData = {
//                 companyName: form.companyNameU.value,
//                 companyAddress: form.companyAddressU.value,
//                 image: uploadedImageBase64 || document.querySelector('#updateCompanyModal #preview-image').src || "",
//                 updatedAt: new Date().toISOString()
//             };

//             try {
//                 const { firebaseCRUD } = await import("./firebase-crud.js");
//                 await firebaseCRUD.updateData("company", companyId, companyData);

//                 showToast("Company updated successfully!", "success");
//                 $('#updateCompanyModal').modal('hide');
//                 await loadCompanies();
//             } catch (error) {
//                 console.error("Error updating company:", error);
//                 showToast("Failed to update company: " + error.message, "error");
//             } finally {
//                 submitButton.prop("disabled", false);
//                 submitButton.text("Update Company");
//             }
//         }
//     });
// });

// // Toast notification function
// function showToast(message, type = "success") {
//     // Replace with your actual toast implementation
//     const toast = document.createElement('div');
//     toast.className = `toast ${type}`;
//     toast.textContent = message;
//     document.body.appendChild(toast);

//     setTimeout(() => {
//         toast.remove();
//     }, 3000);
// }