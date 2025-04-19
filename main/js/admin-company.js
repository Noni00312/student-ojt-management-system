


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





// $(document).ready(function () {
//     loadCompanies();

//     // Debounce the search function to wait 300ms after typing stops
//     const debouncedSearch = debounce(function () {
//         const searchTerm = $("#companySearch").val().trim();
//         if (searchTerm.length > 0) {
//             searchCompanies(searchTerm);
//         } else {
//             loadCompanies();
//         }
//     }, 300);

//     $("#companySearch").on("input", debouncedSearch);



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
//         Adding Company...
//       `);

//             const companyData = {
//                 companyName: form.companyName.value,
//                 companyAddress: form.companyAddress.value,
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
//     loadCompanies();

//     // Debounce the search function to wait 300ms after typing stops
//     const debouncedSearch = debounce(function () {
//         const searchTerm = $("#companySearch").val().trim();
//         if (searchTerm.length > 0) {
//             searchCompanies(searchTerm);
//         } else {
//             loadCompanies();
//         }
//     }, 300);

//     $("#companySearch").on("input", debouncedSearch);

//     // Add this function to check for duplicate company names
//     async function checkCompanyNameExists(companyName) {
//         try {
//             const { firebaseCRUD } = await import("./firebase-crud.js");
//             const companies = await firebaseCRUD.getAllData("company");

//             // Check if any company has the same name (case-insensitive)
//             return companies.some(company =>
//                 company.companyName &&
//                 company.companyName.toLowerCase() === companyName.toLowerCase()
//             );
//         } catch (error) {
//             console.error("Error checking company name:", error);
//             // If there's an error checking, assume name exists to prevent duplicates
//             return true;
//         }
//     }

//     $("#ojtForm").validate({
//         rules: {
//             companyName: {
//                 required: true,
//                 minlength: 2,
//             },
//             companyAddress: {
//                 required: true,
//                 minlength: 2,
//             },
//         },
//         errorPlacement: function (error, element) {
//             error.appendTo($("#" + element.attr("name") + "-error"));
//         },
//         submitHandler: function (form) {
//             const submitButton = $(form).find('button[type="submit"]');
//             const companyName = form.companyName.value.trim();

//             submitButton.prop("disabled", true);
//             submitButton.html(`
//                 <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
//                 Checking...
//             `);

//             // First check if company name exists
//             checkCompanyNameExists(companyName)
//                 .then(nameExists => {
//                     if (nameExists) {
//                         alert("A company with this name already exists!");
//                         submitButton.prop("disabled", false).text("Add Company");
//                         return;
//                     }

//                     // If name is unique, proceed with creation
//                     submitButton.html(`
//                         <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
//                         Adding Company...
//                     `);

//                     const companyData = {
//                         companyName: companyName,
//                         companyAddress: form.companyAddress.value,
//                         image: uploadedImageBase64 || "",
//                         createdAt: new Date().toISOString()
//                     };

//                     return import("./firebase-crud.js")
//                         .then(({ firebaseCRUD }) => {
//                             return firebaseCRUD.createData("company", companyData);
//                         });
//                 })
//                 .then(() => {
//                     if (!companyName) return; // Skip if duplicate check failed

//                     alert("Successfully Inserted!");
//                     form.reset();
//                     document.getElementById("company-name").value = "";
//                     document.getElementById("company-address").value = "";
//                     document.getElementById("preview-image").src = "";
//                     document.getElementById("preview-image").style.display = "none";
//                     document.getElementById("camera-input").value = "";
//                     uploadedImageBase64 = "";

//                     // Refresh the companies list
//                     loadCompanies();
//                 })
//                 .catch((error) => {
//                     console.error("Error:", error);
//                     alert(`Operation failed: ${error.message}`);
//                 })
//                 .finally(() => {
//                     submitButton.prop("disabled", false).text("Add Company");
//                 });
//         },
//     });
// });


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

    // Add this function to check for duplicate company names
    async function checkCompanyNameExists(companyName) {
        try {
            const { firebaseCRUD } = await import("./firebase-crud.js");
            const companies = await firebaseCRUD.getAllData("company");

            // Check if any company has the same name (case-insensitive)
            return companies.some(company =>
                company.companyName &&
                company.companyName.toLowerCase() === companyName.toLowerCase()
            );
        } catch (error) {
            console.error("Error checking company name:", error);
            // If there's an error checking, assume name exists to prevent duplicates
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

            // First check if company name exists
            checkCompanyNameExists(companyName)
                .then(nameExists => {
                    if (nameExists) {
                        alert("A company with this name already exists!");
                        submitButton.prop("disabled", false).text("Add Company");
                        return Promise.reject("Duplicate company name"); // Reject to skip success flow
                    }

                    // If name is unique, proceed with creation
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
                    alert("Successfully Inserted!");
                    form.reset();
                    document.getElementById("company-name").value = "";
                    document.getElementById("company-address").value = "";
                    document.getElementById("preview-image").src = "";
                    document.getElementById("preview-image").style.display = "none";
                    document.getElementById("camera-input").value = "";
                    uploadedImageBase64 = "";

                    // Refresh the companies list
                    loadCompanies();
                })
                .catch((error) => {
                    if (error !== "Duplicate company name") { // Skip logging for expected duplicates
                        console.error("Error:", error);
                        alert(`Operation failed: ${error.message}`);
                    }
                })
                .finally(() => {
                    submitButton.prop("disabled", false).text("Add Company");
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



// // Update form submission - Final Working Version
// $("#ojtFormU").validate({
//     rules: {
//         companyNameU: {
//             required: true,
//             minlength: 2,
//         },
//         companyAddressU: {
//             required: true,
//             minlength: 2,
//         },
//     },
//     messages: {
//         companyNameU: {
//             required: "Please enter company name",
//             minlength: "Company name must be at least 2 characters long",
//         },
//         companyAddressU: {
//             required: "Please enter company address",
//             minlength: "Company address must be at least 2 characters long",
//         },
//     },
//     errorPlacement: function (error, element) {
//         error.appendTo($("#" + element.attr("name") + "-error"));
//     },
//     submitHandler: function (form, event) {
//         event.preventDefault();

//         const submitButton = $(form).find('button[type="submit"]');
//         const companyId = document.getElementById('updateCompanyModal')?.getAttribute('data-company-id');
//         const previewImage = document.querySelector('#updateCompanyModal #update-preview-image');

//         // Check if required elements exist
//         if (!companyId) {
//             alert("Company ID not found");
//             submitButton.prop("disabled", false).text("Update Company");
//             return;
//         }

//         submitButton.prop("disabled", true).html(`
//             <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
//             Updating...
//         `);

//         // Create the base update data
//         const companyData = {
//             companyName: form.companyNameU.value,
//             companyAddress: form.companyAddressU.value,
//             updatedAt: new Date().toISOString()
//         };

//         // Handle image updates
//         if (uploadedImageBase64) {
//             // Case 1: New image was uploaded
//             companyData.image = uploadedImageBase64;
//         } else if (previewImage?.src && previewImage.style.display !== 'none') {
//             // Case 2: Keep existing image - don't include image field
//             // This is key - we don't modify the image field at all
//         } else {
//             // Case 3: Explicitly remove the image
//             companyData.image = "";
//         }

//         import("./firebase-crud.js")
//             .then(({ firebaseCRUD }) => {
//                 return firebaseCRUD.updateData("company", companyId, companyData)
//                     .then(() => {
//                         alert("Company updated successfully!");
//                         return true;
//                     });
//             })
//             .then((success) => {
//                 if (success) {
//                     // Reset form and UI
//                     form.reset();
//                     const modal = bootstrap.Modal.getInstance(document.getElementById('updateCompanyModal'));
//                     modal?.hide();

//                     if (previewImage) {
//                         previewImage.src = '';
//                         previewImage.style.display = 'none';
//                     }
//                     const cameraIcon = document.querySelector('#updateCompanyModal #camera-icon');
//                     if (cameraIcon) {
//                         cameraIcon.style.display = 'block';
//                     }
//                     uploadedImageBase64 = "";

//                     // Refresh the list
//                     loadCompanies();
//                 }
//             })
//             .catch((error) => {
//                 console.error("Update error:", error);
//                 alert(`Update failed: ${error.message}`);
//             })
//             .finally(() => {
//                 submitButton.prop("disabled", false).text("Update Company");
//             });
//     }
// });



// $("#ojtFormU").validate({
//     rules: {
//         companyNameU: {
//             required: true,
//             minlength: 2,
//         },
//         companyAddressU: {
//             required: true,
//             minlength: 2,
//         },
//     },
//     messages: {
//         companyNameU: {
//             required: "Please enter company name",
//             minlength: "Company name must be at least 2 characters long",
//         },
//         companyAddressU: {
//             required: "Please enter company address",
//             minlength: "Company address must be at least 2 characters long",
//         },
//     },
//     errorPlacement: function (error, element) {
//         error.appendTo($("#" + element.attr("name") + "-error"));
//     },
//     submitHandler: function (form, event) {
//         event.preventDefault();

//         const submitButton = $(form).find('button[type="submit"]');
//         const companyId = document.getElementById('updateCompanyModal')?.getAttribute('data-company-id');
//         const previewImage = document.querySelector('#updateCompanyModal #update-preview-image');
//         const newCompanyName = form.companyNameU.value.trim();
//         const newCompanyAddress = form.companyAddressU.value.trim();

//         // Check if required elements exist
//         if (!companyId) {
//             alert("Company ID not found");
//             submitButton.prop("disabled", false).text("Update Company");
//             return;
//         }

//         submitButton.prop("disabled", true).html(`
//             <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
//             Checking...
//         `);

//         // First check if company name exists (excluding current company)
//         checkCompanyNameExists(newCompanyName, companyId, newCompanyAddress)
//             .then(nameExists => {
//                 if (nameExists) {
//                     alert("A company with this name already exists!");
//                     submitButton.prop("disabled", false).text("Update Company");
//                     return Promise.reject("Duplicate company name");
//                 }

//                 // If name is unique, proceed with update
//                 submitButton.html(`
//                     <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
//                     Updating...
//                 `);

//                 // Create the base update data
//                 const companyData = {
//                     companyName: newCompanyName,
//                     companyAddress: form.companyAddressU.value,
//                     updatedAt: new Date().toISOString()
//                 };

//                 // Handle image updates
//                 if (uploadedImageBase64) {
//                     companyData.image = uploadedImageBase64;
//                 } else if (previewImage?.src && previewImage.style.display !== 'none') {
//                     // Keep existing image - don't include image field
//                 } else {
//                     companyData.image = "";
//                 }

//                 return import("./firebase-crud.js")
//                     .then(({ firebaseCRUD }) => {
//                         return firebaseCRUD.updateData("company", companyId, companyData);
//                     });
//             })
//             .then(() => {
//                 alert("Company updated successfully!");

//                 // Reset form and UI
//                 form.reset();
//                 const modal = bootstrap.Modal.getInstance(document.getElementById('updateCompanyModal'));
//                 modal?.hide();

//                 if (previewImage) {
//                     previewImage.src = '';
//                     previewImage.style.display = 'none';
//                 }
//                 const cameraIcon = document.querySelector('#updateCompanyModal #camera-icon');
//                 if (cameraIcon) {
//                     cameraIcon.style.display = 'block';
//                 }
//                 uploadedImageBase64 = "";

//                 // Refresh the list
//                 loadCompanies();
//             })
//             .catch((error) => {
//                 if (error !== "Duplicate company name") {
//                     console.error("Update error:", error);
//                     alert(`Update failed: ${error.message}`);
//                 }
//             })
//             .finally(() => {
//                 submitButton.prop("disabled", false).text("Update Company");
//             });
//     }
// });

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

        // Check if required elements exist
        if (!companyId) {
            alert("Company ID not found");
            submitButton.prop("disabled", false).text("Update Company");
            return;
        }

        submitButton.prop("disabled", true).html(`
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            Checking...
        `);

        // Check for duplicate name+address combination (excluding current company)
        checkCompanyDuplicate(newCompanyName, newCompanyAddress, companyId)
            .then(duplicateExists => {
                if (duplicateExists) {
                    alert("A company with this name and address already exists!");
                    submitButton.prop("disabled", false).text("Update Company");
                    return Promise.reject("Duplicate company");
                }

                // If no duplicate, proceed with update
                submitButton.html(`
                    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Updating...
                `);

                const companyData = {
                    companyName: newCompanyName,
                    companyAddress: newCompanyAddress,
                    updatedAt: new Date().toISOString()
                };

                // Handle image updates
                if (uploadedImageBase64) {
                    companyData.image = uploadedImageBase64;
                } else if (previewImage?.src && previewImage.style.display !== 'none') {
                    // Keep existing image - don't include image field
                } else {
                    companyData.image = "";
                }

                return import("./firebase-crud.js")
                    .then(({ firebaseCRUD }) => {
                        return firebaseCRUD.updateData("company", companyId, companyData);
                    });
            })
            .then(() => {
                alert("Company updated successfully!");

                // Reset form and UI
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

                // Refresh the list
                loadCompanies();
            })
            .catch((error) => {
                if (error !== "Duplicate company") {
                    console.error("Update error:", error);
                    alert(`Update failed: ${error.message}`);
                }
            })
            .finally(() => {
                submitButton.prop("disabled", false).text("Update Company");
            });
    }
});






// // Helper function (should be defined in the same scope)
// async function checkCompanyNameExists(companyName, excludeId = null) {
//     try {
//         const { firebaseCRUD } = await import("./firebase-crud.js");
//         const companies = await firebaseCRUD.getAllData("company");

//         return companies.some(company => {
//             const nameMatches = company.companyName &&
//                 company.companyName.toLowerCase() === companyName.toLowerCase();
//             const isSameCompany = excludeId && company.id === excludeId;
//             return nameMatches && !isSameCompany;
//         });
//     } catch (error) {
//         console.error("Error checking company name:", error);
//         return true;
//     }
// }


// Updated helper function to check for name+address duplicates
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



// Proper modal reset handler
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



// Add this function to check for duplicate company names
async function checkCompanyNameExists(companyName) {
    try {
        const { firebaseCRUD } = await import("./firebase-crud.js");
        const companies = await firebaseCRUD.getAllData("company");

        // Check if any company has the same name (case-insensitive)
        return companies.some(company =>
            company.companyName &&
            company.companyName.toLowerCase() === companyName.toLowerCase()
        );
    } catch (error) {
        console.error("Error checking company name:", error);
        // If there's an error checking, assume name exists to prevent duplicates
        return true;
    }
}

