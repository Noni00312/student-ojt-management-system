// // admin-student.js
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

// function displayStudents(students) {
//     const cardContainer = document.querySelector('.card-container .row');
//     cardContainer.innerHTML = ''; // Clear existing content

//     if (!students || students.length === 0) {
//         cardContainer.innerHTML = '<p class="text-center text-white">No students found</p>';
//         return;
//     }

//     students.forEach((student) => {
//         const colDiv = document.createElement('div');
//         colDiv.className = 'col-lg-4 col-md-6 px-2';

//         colDiv.innerHTML = `
//             <div class="student-card h-100">
//                 <a href="./admin-student-report.html?userId=${student.userId}" class="d-flex align-items-center text-decoration-none h-100">
//                     <div class="img-container me-3 flex-shrink-0">
//                         ${student.userImg ?
//                 `<img src="${student.userImg}" alt="${student.firstName}">` :
//                 `<img src="../assets/img/icons8_male_user_480px_1.png" alt="Default user">`
//             }
//                     </div>
//                     <div class="main-container w-100 overflow-hidden">
//                         <div class="name-id-container d-flex justify-content-between">
//                             <p class="m-0 text-truncate fw-bold">${student.firstName + " " + student.middleName + " " + student.lastName + " " + student.suffix || 'No name'}</p>
//                             <p class="m-0 ms-2 text-nowrap">${student.studentId || 'No ID'}</p>
//                             <p class="d-none">${student.userId || ''}</p>
//                         </div>
//                         <div class="separator my-2"></div>
//                         <div class="company">
//                             <p class="m-0 text-truncate">${student.companyName || 'No company'}</p>
//                         </div>
//                     </div>
//                 </a>
//             </div>
//         `;

//         cardContainer.appendChild(colDiv);
//     });
// }



// function searchStudents(searchTerm) {
//     import("./firebase-crud.js")
//         .then(({ firebaseCRUD }) => {
//             // Always fall back to client-side filtering for better search experience
//             firebaseCRUD.getAllData("students")
//                 .then((allStudents) => {
//                     const filtered = allStudents.filter(student =>
//                     (student.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                         student.studentId?.includes(searchTerm) ||
//                         student.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                         student.middleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                         student.lastName?.toLowerCase().includes(searchTerm.toLowerCase()))
//                     );
//                     displayStudents(filtered);
//                 })
//                 .catch((error) => {
//                     console.error("Error fetching students:", error);
//                 });
//         })
//         .catch((err) => {
//             console.error("Failed to load firebase-crud:", err);
//         });
// }




// $(document).ready(function () {
//     loadStudents();

//     // Search functionality with debounce
//     const debouncedSearch = debounce(function () {
//         const searchTerm = $(".search-input input").val().trim();
//         if (searchTerm.length > 0) {
//             searchStudents(searchTerm);
//         } else {
//             loadStudents();
//         }
//     }, 300);

//     $(".search-input input").on("input", debouncedSearch);
// });


// admin-assistant.js
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

function loadAssistants() {
    import("./firebase-crud.js")
        .then(({ firebaseCRUD }) => {
            // Query students where userType is "studentAssistant"
            firebaseCRUD.queryData("students", "userType", "==", "studentAssistant")
                .then((assistants) => {
                    displayStudents(assistants);
                })
                .catch((error) => {
                    console.error("Error loading assistants:", error);
                    alert("Failed to load assistants: " + error.message);
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
        cardContainer.innerHTML = '<p class="text-center text-white">No assistants found</p>';
        return;
    }

    students.forEach((student) => {
        const colDiv = document.createElement('div');
        colDiv.className = 'col-lg-4 col-md-6 px-2';

        colDiv.innerHTML = `
            <div class="student-card h-100">
                <a href="./admin-assistant-report.html?userId=${student.userId}" class="d-flex align-items-center text-decoration-none h-100">
                    <div class="img-container me-3 flex-shrink-0">
                        ${student.userImg ?
                `<img src="${student.userImg}" alt="${student.firstName}">` :
                `<img src="../assets/img/icons8_male_user_480px_1.png" alt="Default user">`
            }
                    </div>
                    <div class="main-container w-100 overflow-hidden">
                        <div class="name-id-container d-flex justify-content-between">
                            <p class="m-0 text-truncate fw-bold">${student.firstName} ${student.middleName || ''} ${student.lastName} ${student.suffix || ''}</p>
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

function searchAssistants(searchTerm) {
    import("./firebase-crud.js")
        .then(({ firebaseCRUD }) => {
            // First query all assistants, then filter on client side
            firebaseCRUD.queryData("students", "userType", "==", "studentAssistant")
                .then((assistants) => {
                    const filtered = assistants.filter(student =>
                    (student.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        student.studentId?.includes(searchTerm) ||
                        student.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        student.middleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        student.lastName?.toLowerCase().includes(searchTerm.toLowerCase()))
                    );
                    displayStudents(filtered);
                })
                .catch((error) => {
                    console.error("Error fetching assistants:", error);
                });
        })
        .catch((err) => {
            console.error("Failed to load firebase-crud:", err);
        });
}

$(document).ready(function () {
    loadAssistants();

    // Search functionality with debounce
    const debouncedSearch = debounce(function () {
        const searchTerm = $(".search-input input").val().trim();
        if (searchTerm.length > 0) {
            searchAssistants(searchTerm);
        } else {
            loadAssistants();
        }
    }, 300);

    $(".search-input input").on("input", debouncedSearch);
});



