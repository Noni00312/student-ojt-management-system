document.addEventListener('DOMContentLoaded', async function () {
    // try {
    //     // Get userId from URL or localStorage
    //     const userId = getUserIdFromUrl() || localStorage.getItem('userId');
    //     console.log(userId);

    //     if (userId) {
    //         // First verify this is actually an assistant
    //         const { firebaseCRUD } = await import("./firebase-crud.js");
    //         const students = await firebaseCRUD.queryData("students", "userId", "==", userId);

    //         if (!students || students.length === 0) throw new Error("Assistant not found");
    //         if (students[0].userType !== "studentAssistant") {
    //             throw new Error("This user is not an assistant");
    //         }

    //         await loadAssistantReports(userId);
    //     } else {
    //         console.error("No user ID found");
    //         // window.location.href = 'admin-assistant.html';
    //     }
    // } catch (error) {
    //     console.error("Initialization error:", error);
    //     showErrorToast("Failed to initialize: " + error.message);
    // }



    try {
        // Get userId from URL or localStorage
        const userId = getUserIdFromUrl() || localStorage.getItem('userId');
        console.log(userId);

        if (userId) {
            await loadAssistantReports(userId);

            // Added: Check if already assistant when page loads
            try {
                const { firebaseCRUD } = await import("./firebase-crud.js");
                const students = await firebaseCRUD.queryData("students", "userId", "==", userId);

                if (students?.[0]?.userType === "studentAssistant") {
                    const btn = document.getElementById('appoint-assistant-btn');
                    if (btn) {
                        btn.textContent = "Assistant Appointed";
                        btn.disabled = true;
                    }
                }
            } catch (error) {
                console.error("Error checking assistant status:", error);
            }
            // End of added code

        } else {
            console.error("No user ID found");
            // window.location.href = 'admin-student.html';
        }
    } catch (error) {
        console.error("Initialization error:", error);
        showErrorToast("Failed to initialize: " + error.message);
    }

});



// Updated appoint assistant functionality
document.getElementById('appoint-assistant-btn')?.addEventListener('click', async function () {
    try {
        const userId = getUserIdFromUrl() || localStorage.getItem('userId');
        if (!userId) throw new Error("No user ID found");

        const { firebaseCRUD } = await import("./firebase-crud.js");

        // First query the student to get their document ID
        const students = await firebaseCRUD.queryData("students", "userId", "==", userId);
        if (!students || students.length === 0) throw new Error("Student not found");

        const studentDocId = students[0].id; // Assuming the document ID is stored in the 'id' field

        // Update userType to studentAssistant using the document ID
        await firebaseCRUD.updateData("students", studentDocId, { userType: "studentAssistant" });

        // Show success message and disable button
        showErrorToast("Student appointed as assistant successfully!");
        this.textContent = "Assistant Appointed";
        this.disabled = true;

    } catch (error) {
        console.error("Error appointing assistant:", error);
        showErrorToast("Failed to appoint assistant: " + error.message);
    }
});






function getUserIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('userId');
}

async function loadAssistantReports(userId) {
    try {
        const { firebaseCRUD } = await import("./firebase-crud.js");

        // Query assistant by userId field
        const assistants = await firebaseCRUD.queryData("students", "userId", "==", userId);
        if (!assistants || assistants.length === 0) throw new Error("Assistant not found");
        if (assistants[0].userType !== "studentAssistant") {
            throw new Error("This user is not an assistant");
        }

        const assistant = assistants[0];
        displayStudentInfo(assistant);

        // Get all reports for this assistant from the assistantreports collection
        const reports = await firebaseCRUD.queryData("assistantreports", "userId", "==", userId);

        // Sort reports by createdAt in descending order
        reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (reports && reports.length > 0) {
            displayReports(reports);
            setupDateNavigation(reports);
        } else {
            displayNoReportsMessage();
        }

    } catch (error) {
        console.error("Error loading reports:", error);
        showErrorToast("Failed to load reports: " + error.message);
    }
}

function displayStudentInfo(student) {
    const studentNameElement = document.querySelector('.student-name');
    if (studentNameElement) {
        studentNameElement.textContent = `${student.firstName} ${student.middleName || ''} ${student.lastName} ${student.suffix || ''}`.trim();
    }
}

function formatDateTime(dateString) {
    const date = new Date(dateString);

    const timeOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    const formattedTime = date.toLocaleTimeString('en-US', timeOptions);

    const dateOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    const formattedDate = date.toLocaleDateString('en-US', dateOptions);

    return {
        time: formattedTime,
        date: formattedDate,
        monthName: date.toLocaleString('default', { month: 'long' }),
        monthDay: date.getDate(),
        fullDate: dateString
    };
}

async function displayReports(reports) {
    const reportsContainer = document.querySelector('.student-report-container');
    reportsContainer.innerHTML = '';

    for (const report of reports) {
        const formattedDateTime = formatDateTime(report.createdAt);

        // Load base64 images - path changed to assistantreports collection
        const images = await loadReportImages(report.id);

        const reportElement = document.createElement('div');
        reportElement.className = 'report p-2';

        reportElement.innerHTML = `
      <p class="text-end text-light">
        <small class="font-darker-light-color">${formattedDateTime.time}</small>
      </p>
      <h2 class="border-bottom border-light text-truncate pb-2 fw-bold font-darker-light-color">
        ${report.title || 'Daily Report'}
      </h2>
      ${images.length > 0 ? `
        <div class="image-container mb-2 d-flex flex-row flex-nowrap gap-2 overflow-auto">
          ${images.map(base64Img => `
            <img src="${base64Img}" alt="Report image"
              class="clickable-report-image"
              style="max-width: 100px; max-height: 100px; object-fit: cover; border-radius: 8px; cursor: pointer;">
          `).join('')}
        </div>` : ''
            }
      <div class="content-container mt-2">
        <p class="text-light fs-6 fw-normal mb-0">
          ${report.content || 'No content provided'}
        </p>
      </div>
    `;

        reportsContainer.appendChild(reportElement);

        // Add click listeners to all newly added images
        const imageElements = reportElement.querySelectorAll('.clickable-report-image');
        imageElements.forEach(img => {
            img.addEventListener('click', () => {
                document.getElementById('modal-image-view').src = img.src;
                const viewImageModal = new bootstrap.Modal(document.getElementById('viewImageModal'));
                viewImageModal.show();
            });
        });
    }
}

async function loadReportImages(reportId) {
    try {
        const { firebaseCRUD } = await import("./firebase-crud.js");
        // Changed path to assistantreports collection
        const imageDocs = await firebaseCRUD.getAllData(`assistantreports/${reportId}/images`);

        const images = [];
        imageDocs.forEach(doc => {
            if (doc.imageData) {
                images.push(doc.imageData); // already base64 with prefix
            }
        });

        return images;
    } catch (error) {
        console.error(`Failed to load images for report ${reportId}:`, error);
        return [];
    }
}

function setupDateNavigation(reports) {
    const dateContainer = document.querySelector('.date-container');
    dateContainer.innerHTML = '';

    const uniqueDates = [...new Set(
        reports.map(report => {
            const date = new Date(report.createdAt);
            return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
        })
    )];

    uniqueDates.forEach(dateString => {
        const date = new Date(dateString);
        const formattedDate = formatDateTime(dateString);
        const reportsForDate = reports.filter(report => {
            const reportDate = new Date(report.createdAt);
            return reportDate.getFullYear() === date.getFullYear() &&
                reportDate.getMonth() === date.getMonth() &&
                reportDate.getDate() === date.getDate();
        });

        const dateButton = document.createElement('button');
        dateButton.className = 'w-100 border-0 px-0 py-2 bg-transparent d-flex align-items-center justify-content-between border-bottom border-light rounded-0';
        dateButton.innerHTML = `
      <span class="report-date-sm mt-1 d-flex flex-column align-items-center justify-content-between d-md-none text-center w-100">
        <span id="month-name-sm" class="fw-normal text-truncate" style="font-size: 12px; width: calc(100% - 5px)">
          ${formattedDate.monthName}
        </span>
        <span id="month-date-sm" class="fs-3 fw-bold">${formattedDate.monthDay}</span>
      </span>
      <span class="d-none d-md-block d-flex text-center w-100 fw-normal">${formattedDate.date}</span>
    `;

        dateButton.addEventListener('click', () => {
            filterReportsByDate(date, reports);
        });

        dateContainer.appendChild(dateButton);
    });
}

function filterReportsByDate(selectedDate, allReports) {
    const filteredReports = allReports.filter(report => {
        const reportDate = new Date(report.createdAt);
        return reportDate.getFullYear() === selectedDate.getFullYear() &&
            reportDate.getMonth() === selectedDate.getMonth() &&
            reportDate.getDate() === selectedDate.getDate();
    });

    displayReports(filteredReports);
}

function displayNoReportsMessage() {
    const reportsContainer = document.querySelector('.student-report-container');
    reportsContainer.innerHTML = `
    <div class="text-center text-light py-5">
      <i class="bi bi-file-earmark-text fs-1"></i>
      <p class="mt-3">No reports found for this assistant</p>
    </div>
  `;
}

function showErrorToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center text-white bg-danger position-fixed bottom-0 end-0 m-3';
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








// document.querySelector('[data-bs-target="#editDataModal"]')?.addEventListener('click', async function () {
//     try {
//         const userId = getUserIdFromUrl() || localStorage.getItem('userId');
//         if (!userId) throw new Error("No user ID found");

//         const { firebaseCRUD } = await import("./firebase-crud.js");

//         // Initialize dropdowns first
//         await initializeDropdowns();

//         // Then load and set student data
//         await loadAndSetStudentData(userId);

//     } catch (error) {
//         console.error("Error loading student data:", error);
//         showErrorToast("Failed to load student data: " + error.message);
//     }
// });

// async function initializeDropdowns() {
//     // Initialize gender dropdown
//     const genderSelect = document.getElementById('gender');
//     // Clear and repopulate to ensure fresh state
//     genderSelect.innerHTML = `
//     <option value="male">Male</option>
//     <option value="female">Female</option>
//   `;

//     // Initialize company dropdown
//     const companySelect = document.getElementById('companyName');
//     // Clear existing options except the first empty one
//     companySelect.innerHTML = '<option value="">Select a company</option>';

//     // Load companies from database
//     try {
//         const companies = await firebaseCRUD.getAllData("company");

//         if (companies) {
//             // Convert to array if it's an object
//             const companiesArray = Array.isArray(companies) ? companies : Object.values(companies);

//             if (companiesArray?.length) {
//                 companiesArray.forEach(company => {
//                     if (company?.companyName) {
//                         const option = document.createElement('option');
//                         option.value = company.companyName;
//                         option.textContent = company.companyName;
//                         companySelect.appendChild(option);
//                     }
//                 });
//             }
//         }
//     } catch (error) {
//         console.warn("Could not load company list:", error);
//         // Add default companies if the fetch fails
//         ['DAR', 'DOST'].forEach(company => {
//             const option = document.createElement('option');
//             option.value = company;
//             option.textContent = company;
//             companySelect.appendChild(option);
//         });
//     }
// }





// async function loadAndSetStudentData(userId) {
//     // Get student data
//     const students = await firebaseCRUD.queryData("students", "userId", "==", userId);
//     if (!students || students.length === 0) throw new Error("Student not found");

//     const student = students[0];

//     // Set basic form fields
//     document.getElementById('user-id').value = userId;
//     document.getElementById('student-id').value = student.studentId || '';
//     document.getElementById('phone-number').value = student.phoneNumber || '';
//     document.getElementById('first-name').value = student.firstName || '';
//     document.getElementById('middle-name').value = student.middleName || '';
//     document.getElementById('last-name').value = student.lastName || '';
//     document.getElementById('sufix').value = student.suffix || '';
//     document.getElementById('address').value = student.address || '';

//     // Set gender selection (dropdown is already populated)
//     if (student.gender) {
//         document.getElementById('gender').value = student.gender;
//     }

//     // Set company selection (dropdown is already populated)
//     if (student.companyName) {
//         document.getElementById('companyName').value = student.companyName;
//     }

//     // Set time values
//     document.getElementById('morning-time-in').value = student.morningTimeIn || '';
//     document.getElementById('morning-time-out').value = student.morningTimeOut || '';
//     document.getElementById('afternoon-time-in').value = student.afternoonTimeIn || '';
//     document.getElementById('afternoon-time-out').value = student.afternoonTimeOut || '';

//     // Set user type
//     document.getElementById('user-type').value = student.userType || 'student';

//     // Set profile image if available
//     if (student.userImg) {
//         document.getElementById('user-profile-img').src = student.userImg;
//     }
// }







// // Form submission handler
// document.getElementById('edit-info-form')?.addEventListener('submit', async function (e) {
//     e.preventDefault();

//     try {
//         const userId = getUserIdFromUrl() || localStorage.getItem('userId');
//         if (!userId) throw new Error("No user ID found");

//         const { firebaseCRUD } = await import("./firebase-crud.js");

//         // Get form data
//         const formData = {
//             studentId: document.getElementById('student-id').value,
//             phoneNumber: document.getElementById('phone-number').value,
//             firstName: document.getElementById('first-name').value,
//             middleName: document.getElementById('middle-name').value,
//             lastName: document.getElementById('last-name').value,
//             suffix: document.getElementById('sufix').value,
//             gender: document.getElementById('gender').value,
//             address: document.getElementById('address').value,
//             companyName: document.getElementById('companyName').value,
//             morningTimeIn: document.getElementById('morning-time-in').value,
//             morningTimeOut: document.getElementById('morning-time-out').value,
//             afternoonTimeIn: document.getElementById('afternoon-time-in').value,
//             afternoonTimeOut: document.getElementById('afternoon-time-out').value,
//             userType: document.getElementById('user-type').value,
//             updatedAt: new Date().toISOString()
//         };

//         // First query the student to get their document ID
//         const students = await firebaseCRUD.queryData("students", "userId", "==", userId);
//         if (!students || students.length === 0) throw new Error("Student not found");

//         const studentDocId = students[0].id;

//         // Update student data
//         await firebaseCRUD.updateData("students", studentDocId, formData);

//         // Show success message
//         showErrorToast("Student information updated successfully!");

//         // Close the modal
//         const editModal = bootstrap.Modal.getInstance(document.getElementById('editDataModal'));
//         editModal.hide();

//         // Refresh the displayed student info
//         displayStudentInfo({ ...students[0], ...formData });

//     } catch (error) {
//         console.error("Error updating student:", error);
//         showErrorToast("Failed to update student: " + error.message);
//     }
// });



// Edit button click handler
document.querySelector('[data-bs-target="#editDataModal"]')?.addEventListener('click', async function () {
    try {
        const userId = getUserIdFromUrl() || localStorage.getItem('userId');
        if (!userId) throw new Error("No user ID found");

        const { firebaseCRUD } = await import("./firebase-crud.js");

        // Initialize dropdowns first with firebaseCRUD
        await initializeDropdowns(firebaseCRUD);

        // Then load and set student data with firebaseCRUD
        await loadAndSetStudentData(userId, firebaseCRUD);

    } catch (error) {
        console.error("Error loading student data:", error);
        showErrorToast("Failed to load student data: " + error.message);
    }
});

// Initialize dropdowns with firebaseCRUD parameter
async function initializeDropdowns(firebaseCRUD) {
    // Initialize gender dropdown
    const genderSelect = document.getElementById('gender');
    genderSelect.innerHTML = `
    <option value="male">Male</option>
    <option value="female">Female</option>
  `;

    // Initialize company dropdown
    const companySelect = document.getElementById('companyName');
    companySelect.innerHTML = '<option value="">Select a company</option>';

    // Load companies from database
    try {
        const companies = await firebaseCRUD.getAllData("company");

        if (companies) {
            // Convert to array if it's an object
            const companiesArray = Array.isArray(companies) ? companies : Object.values(companies);

            if (companiesArray?.length) {
                companiesArray.forEach(company => {
                    if (company?.companyName) {
                        const option = document.createElement('option');
                        option.value = company.companyName;
                        option.textContent = company.companyName;
                        companySelect.appendChild(option);
                    }
                });
            }
        }
    } catch (error) {
        console.warn("Could not load company list:", error);
        // Add default companies if the fetch fails
        ['DAR', 'DOST'].forEach(company => {
            const option = document.createElement('option');
            option.value = company;
            option.textContent = company;
            companySelect.appendChild(option);
        });
    }
}

// Load student data with firebaseCRUD parameter
async function loadAndSetStudentData(userId, firebaseCRUD) {
    // Get student data
    const students = await firebaseCRUD.queryData("students", "userId", "==", userId);
    if (!students || students.length === 0) throw new Error("Student not found");

    const student = students[0];

    // Set basic form fields
    document.getElementById('user-id').value = userId;
    document.getElementById('student-id').value = student.studentId || '';
    document.getElementById('phone-number').value = student.phoneNumber || '';
    document.getElementById('first-name').value = student.firstName || '';
    document.getElementById('middle-name').value = student.middleName || '';
    document.getElementById('last-name').value = student.lastName || '';
    document.getElementById('sufix').value = student.suffix || '';
    document.getElementById('address').value = student.address || '';

    // Set gender selection
    if (student.gender) {
        document.getElementById('gender').value = student.gender;
    }

    // Set company selection
    if (student.companyName) {
        const companySelect = document.getElementById('companyName');
        companySelect.value = student.companyName;

        // If the value wasn't set (option didn't exist), add it
        if (companySelect.value !== student.companyName) {
            const option = document.createElement('option');
            option.value = student.companyName;
            option.textContent = student.companyName;
            option.selected = true;
            companySelect.appendChild(option);
        }
    }

    // Set time values
    document.getElementById('morning-time-in').value = student.morningTimeIn || '';
    document.getElementById('morning-time-out').value = student.morningTimeOut || '';
    document.getElementById('afternoon-time-in').value = student.afternoonTimeIn || '';
    document.getElementById('afternoon-time-out').value = student.afternoonTimeOut || '';

    // Set user type
    document.getElementById('user-type').value = student.userType || 'student';

    // Set profile image if available
    if (student.userImg) {
        document.getElementById('user-profile-img').src = student.userImg;
    }
}

// Form submission handler
document.getElementById('edit-info-form')?.addEventListener('submit', async function (e) {
    e.preventDefault();

    try {
        const userId = getUserIdFromUrl() || localStorage.getItem('userId');
        if (!userId) throw new Error("No user ID found");

        const { firebaseCRUD } = await import("./firebase-crud.js");

        // Get form data
        const formData = {
            studentId: document.getElementById('student-id').value,
            phoneNumber: document.getElementById('phone-number').value,
            firstName: document.getElementById('first-name').value,
            middleName: document.getElementById('middle-name').value,
            lastName: document.getElementById('last-name').value,
            suffix: document.getElementById('sufix').value,
            gender: document.getElementById('gender').value,
            address: document.getElementById('address').value,
            companyName: document.getElementById('companyName').value,
            morningTimeIn: document.getElementById('morning-time-in').value,
            morningTimeOut: document.getElementById('morning-time-out').value,
            afternoonTimeIn: document.getElementById('afternoon-time-in').value,
            afternoonTimeOut: document.getElementById('afternoon-time-out').value,
            userType: document.getElementById('user-type').value,
            updatedAt: new Date().toISOString()
        };

        // First query the student to get their document ID
        const students = await firebaseCRUD.queryData("students", "userId", "==", userId);
        if (!students || students.length === 0) throw new Error("Student not found");

        const studentDocId = students[0].id;

        // Update student data
        await firebaseCRUD.updateData("students", studentDocId, formData);

        // Show success message
        showErrorToast("Student information updated successfully!");

        // Close the modal
        const editModal = bootstrap.Modal.getInstance(document.getElementById('editDataModal'));
        editModal.hide();

        // Refresh the displayed student info
        displayStudentInfo({ ...students[0], ...formData });

    } catch (error) {
        console.error("Error updating student:", error);
        showErrorToast("Failed to update student: " + error.message);
    }
});