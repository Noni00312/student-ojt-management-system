// // Add this utility function at the top of your admin-company.js
// function debounce(func, wait) {
//     let timeout;
//     return function executedFunction(...args) {
//         const later = () => {
//             clearTimeout(timeout);
//             func(...args);
//         };
//         clearTimeout(timeout);
//         timeout = setTimeout(later, wait);
//     };
// }


// function loadStudents() {
//     import("./firebase-crud.js")
//         .then(({ firebaseCRUD }) => {
//             firebaseCRUD.getAllData("students")
//                 .then((students) => {
//                     displayStudents(students);
//                 })
//                 .catch((error) => {
//                     console.error("Error loading students:", error);
//                     alert("Failed to load students: " + error.message);
//                 });
//         })
//         .catch((err) => {
//             console.error("Failed to load firebase-crud:", err);
//         });
// }

// // Function to display companies
// function displayStudents(students) {
//     const cardContainer = document.querySelector('.card-container');
//     cardContainer.innerHTML = ''; // Clear existing content

//     if (!students || students.length === 0) {
//         cardContainer.innerHTML = '<p class="text-center">No students found</p>';
//         return;
//     }

//     companies.forEach((students) => {
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
//             <p class="d-none">${company.id || ''}</p>
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

//     // Add event listeners to all edit buttons
//     document.querySelectorAll('.edit-btn').forEach(button => {
//         button.addEventListener('click', function () {
//             const companyId = this.getAttribute('data-id');
//             loadCompanyDataForUpdate(companyId);
//         });
//     });
// }



// function searchCompanies(searchTerm) {
//     console.log("Searching for:", searchTerm); // Debug log

//     import("./firebase-crud.js")
//         .then(({ firebaseCRUD }) => {
//             console.log("Firebase CRUD loaded"); // Debug log

//             firebaseCRUD.getDataById("company", "companyName", "==", searchTerm)
//                 .then((companies) => {
//                     console.log("Initial results:", companies); // Debug log

//                     // For more flexible matching, filter client-side
//                     const filtered = companies.filter(company =>
//                         company.companyName &&
//                         company.companyName.toLowerCase().includes(searchTerm.toLowerCase())
//                     );

//                     console.log("Filtered results:", filtered); // Debug log
//                     displayCompanies(filtered);
//                 })
//                 .catch((error) => {
//                     console.error("Error with search, falling back to client-side filtering:", error);

//                     // Fallback to client-side filtering if search fails
//                     firebaseCRUD.getAllData("company")
//                         .then((allCompanies) => {
//                             const filtered = allCompanies.filter(company =>
//                                 company.companyName &&
//                                 company.companyName.toLowerCase().includes(searchTerm.toLowerCase())
//                             );
//                             displayCompanies(filtered);
//                         })
//                         .catch(fallbackError => {
//                             console.error("Fallback also failed:", fallbackError);
//                         });
//                 });
//         })
//         .catch((err) => {
//             console.error("Failed to load firebase-crud:", err);
//         });
// }




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
//                         return Promise.reject("Duplicate company name"); // Reject to skip success flow
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
//                     if (error !== "Duplicate company name") { // Skip logging for expected duplicates
//                         console.error("Error:", error);
//                         alert(`Operation failed: ${error.message}`);
//                     }
//                 })
//                 .finally(() => {
//                     submitButton.prop("disabled", false).text("Add Company");
//                 });
//         },
//     });
// });



// admin-student.js
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

function loadStudents() {
    import("./firebase-crud.js")
        .then(({ firebaseCRUD }) => {
            firebaseCRUD.getAllData("students")
                .then((students) => {
                    displayStudents(students);
                })
                .catch((error) => {
                    console.error("Error loading students:", error);
                    alert("Failed to load students: " + error.message);
                });
        })
        .catch((err) => {
            console.error("Failed to load firebase-crud:", err);
        });
}

function displayStudents(students) {
    const cardContainer = document.querySelector('.card-container .row');
    cardContainer.innerHTML = ''; // Clear existing content

    if (!students || students.length === 0) {
        cardContainer.innerHTML = '<p class="text-center text-white">No students found</p>';
        return;
    }

    students.forEach((student) => {
        const colDiv = document.createElement('div');
        colDiv.className = 'col-lg-4 col-md-6 px-2';

        colDiv.innerHTML = `
            <div class="student-card h-100">
                <a href="./admin-student-report.html?userId=${student.userId}" class="d-flex align-items-center text-decoration-none h-100">
                    <div class="img-container me-3 flex-shrink-0">
                        ${student.userImg ?
                `<img src="${student.userImg}" alt="${student.firstName}">` :
                `<img src="../assets/img/icons8_male_user_480px_1.png" alt="Default user">`
            }
                    </div>
                    <div class="main-container w-100 overflow-hidden">
                        <div class="name-id-container d-flex justify-content-between">
                            <p class="m-0 text-truncate fw-bold">${student.firstName + " " + student.middleName + " " + student.lastName + " " + student.suffix || 'No name'}</p>
                            <p class="m-0 ms-2 text-nowrap">${student.studentId || 'No ID'}</p>
                            <p class="d-none">${student.userId || ''}</p>
                        </div>
                        <div class="separator my-2"></div>
                        <div class="company">
                            <p class="m-0 text-truncate">${student.companyName || 'No company'}</p>
                        </div>
                    </div>
                </a>
            </div>
        `;

        cardContainer.appendChild(colDiv);
    });
}



function searchStudents(searchTerm) {
    import("./firebase-crud.js")
        .then(({ firebaseCRUD }) => {
            // Always fall back to client-side filtering for better search experience
            firebaseCRUD.getAllData("students")
                .then((allStudents) => {
                    const filtered = allStudents.filter(student =>
                    (student.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        student.studentId?.includes(searchTerm) ||
                        student.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        student.middleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        student.lastName?.toLowerCase().includes(searchTerm.toLowerCase()))
                    );
                    displayStudents(filtered);
                })
                .catch((error) => {
                    console.error("Error fetching students:", error);
                });
        })
        .catch((err) => {
            console.error("Failed to load firebase-crud:", err);
        });
}




$(document).ready(function () {
    loadStudents();

    // Search functionality with debounce
    const debouncedSearch = debounce(function () {
        const searchTerm = $(".search-input input").val().trim();
        if (searchTerm.length > 0) {
            searchStudents(searchTerm);
        } else {
            loadStudents();
        }
    }, 300);

    $(".search-input input").on("input", debouncedSearch);
});