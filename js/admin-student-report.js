// document.addEventListener("DOMContentLoaded", function () {
//   const monthYear = document.getElementById("month-year");
//   const daysContainer = document.getElementById("days");
//   const prevButton = document.getElementById("prev");
//   const nextButton = document.getElementById("next");
//   const months = [
//     "January",
//     "February",
//     "March",
//     "April",
//     "May",
//     "June",
//     "July",
//     "August",
//     "September",
//     "October",
//     "November",
//     "December",
//   ];
//   let currentDate = new Date();
//   let today = new Date();
//   function renderCalendar(date) {
//     const year = date.getFullYear();
//     const month = date.getMonth();
//     const firstDay = new Date(year, month, 1).getDay();
//     const lastDay = new Date(year, month + 1, 0).getDate();
//     monthYear.textContent = `${months[month]} ${year}`;
//     daysContainer.innerHTML = "";
//     // Previous month's dates
//     const prevMonthLastDay = new Date(year, month, 0).getDate();
//     for (let i = firstDay; i > 0; i--) {
//       const dayDiv = document.createElement("div");
//       dayDiv.textContent = prevMonthLastDay - i + 1;
//       dayDiv.classList.add("fade-date");
//       daysContainer.appendChild(dayDiv);
//     }
//     // Current month's dates
//     for (let i = 1; i <= lastDay; i++) {
//       const dayDiv = document.createElement("div");
//       dayDiv.textContent = i;
//       if (
//         i === today.getDate() &&
//         month === today.getMonth() &&
//         year === today.getFullYear()
//       ) {
//         dayDiv.classList.add("today");
//       }
//       daysContainer.appendChild(dayDiv);
//     }
//     // Next month's dates
//     const nextMonthStartDay = 7 - new Date(year, month + 1, 0).getDay() - 1;
//     for (let i = 1; i <= nextMonthStartDay; i++) {
//       const dayDiv = document.createElement("div");
//       dayDiv.textContent = i;
//       dayDiv.classList.add("fade-date");
//       daysContainer.appendChild(dayDiv);
//     }
//   }
//   prevButton.addEventListener("click", function () {
//     currentDate.setMonth(currentDate.getMonth() - 1);
//     renderCalendar(currentDate);
//   });
//   nextButton.addEventListener("click", function () {
//     currentDate.setMonth(currentDate.getMonth() + 1);
//     renderCalendar(currentDate);
//   });
//   renderCalendar(currentDate);
// });

import { firebaseCRUD } from "./firebase-crud.js";



// document.addEventListener('DOMContentLoaded', function () {
//   // Get userId from URL or localStorage
//   const userId = getUserIdFromUrl() || localStorage.getItem('userId');

//   if (userId) {
//     loadStudentReports(userId);
//   } else {
//     console.error("No user ID found");
//     // Redirect back to students list
//     // window.location.href = 'admin-student.html';
//   }
// });

// function getUserIdFromUrl() {
//   const urlParams = new URLSearchParams(window.location.search);
//   return urlParams.get('userId');
// }

// function loadStudentReports(userId) {
//   import("./firebase-crud.js")
//     .then(({ firebaseCRUD }) => {
//       // First get student info to display name
//       firebaseCRUD.getDocument("students", userId)
//         .then((student) => {
//           if (student) {
//             displayStudentInfo(student);

//             // Then get all reports for this student
//             return firebaseCRUD.getDocumentsByField(
//               "reports",
//               "userId", // Field to filter by
//               userId,   // The user's ID
//               "createdAt", // Field to order by
//               "desc"    // Sort direction
//             );
//           } else {
//             throw new Error("Student not found");
//           }
//         })
//         .then((reports) => {
//           if (reports && reports.length > 0) {
//             displayReports(reports);
//             setupDateNavigation(reports);
//           } else {
//             displayNoReportsMessage();
//           }
//         })
//         .catch((error) => {
//           console.error("Error loading reports:", error);
//           showErrorToast("Failed to load reports: " + error.message);
//         });
//     })
//     .catch((err) => {
//       console.error("Failed to load firebase-crud:", err);
//     });
// }

// function displayStudentInfo(student) {
//   // Update the student name in the navbar
//   const studentNameElement = document.querySelector('.student-name');
//   if (studentNameElement) {
//     studentNameElement.textContent = `${student.firstName} ${student.middleName || ''} ${student.lastName} ${student.suffix || ''}`.trim();
//   }
// }

// function formatDateTime(dateString) {
//   const date = new Date(dateString);

//   // Format time (12:30:40 AM)
//   const timeOptions = {
//     hour: '2-digit',
//     minute: '2-digit',
//     second: '2-digit',
//     hour12: true
//   };
//   const formattedTime = date.toLocaleTimeString('en-US', timeOptions);

//   // Format date (April 17, 2025)
//   const dateOptions = {
//     year: 'numeric',
//     month: 'long',
//     day: 'numeric'
//   };
//   const formattedDate = date.toLocaleDateString('en-US', dateOptions);

//   return {
//     time: formattedTime,
//     date: formattedDate,
//     monthName: date.toLocaleString('default', { month: 'long' }),
//     monthDay: date.getDate(),
//     fullDate: dateString // Keep original for sorting
//   };
// }

// function displayReports(reports) {
//   const reportsContainer = document.querySelector('.student-report-container');
//   reportsContainer.innerHTML = ''; // Clear existing content

//   reports.forEach(report => {
//     const formattedDateTime = formatDateTime(report.createdAt);

//     const reportElement = document.createElement('div');
//     reportElement.className = 'report p-2';
//     reportElement.innerHTML = `
//             <p class="text-end text-light">
//                 <small class="font-darker-light-color">${formattedDateTime.time}</small>
//             </p>
//             <h2 class="border-bottom border-light text-truncate pb-2 fw-bold font-darker-light-color">
//                 ${report.title || 'Daily Report'}
//             </h2>
//             ${report.hasImages ?
//         `<div class="image-container d-flex align-items-center me-3">
//                     <!-- Images would be loaded here if you implement image storage -->
//                     <img src="../assets/img/icons8_full_image_480px_1.png" alt="Report image">
//                 </div>` :
//         ''
//       }
//             <div class="content-container">
//                 <p class="text-light fs-6 fw-normal mb-0">
//                     ${report.content || 'No content provided'}
//                 </p>
//             </div>
//         `;

//     reportsContainer.appendChild(reportElement);
//   });
// }

// function setupDateNavigation(reports) {
//   const dateContainer = document.querySelector('.date-container');
//   dateContainer.innerHTML = ''; // Clear existing dates

//   // Get unique dates from reports
//   const uniqueDates = [...new Set(
//     reports.map(report => {
//       const date = new Date(report.createdAt);
//       return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
//     })
//   )];

//   uniqueDates.forEach(dateString => {
//     const date = new Date(dateString);
//     const formattedDate = formatDateTime(dateString);
//     const reportsForDate = reports.filter(report => {
//       const reportDate = new Date(report.createdAt);
//       return reportDate.getFullYear() === date.getFullYear() &&
//         reportDate.getMonth() === date.getMonth() &&
//         reportDate.getDate() === date.getDate();
//     });

//     const dateButton = document.createElement('button');
//     dateButton.className = 'w-100 border-0 px-0 py-2 bg-transparent d-flex align-items-center justify-content-between border-bottom border-light rounded-0';
//     dateButton.innerHTML = `
//             <span class="report-date-sm mt-1 d-flex flex-column align-items-center justify-content-between d-md-none text-center w-100">
//                 <span id="month-name-sm" class="fw-normal text-truncate" style="font-size: 12px; width: calc(100% - 5px)">
//                     ${formattedDate.monthName}
//                 </span>
//                 <span id="month-date-sm" class="fs-3 fw-bold">${formattedDate.monthDay}</span>
//             </span>
//             <span class="d-none d-md-block d-flex text-center w-100 fw-normal">${formattedDate.date}</span>
//         `;

//     dateButton.addEventListener('click', () => {
//       filterReportsByDate(date, reports);
//     });

//     dateContainer.appendChild(dateButton);
//   });
// }

// function filterReportsByDate(selectedDate, allReports) {
//   const filteredReports = allReports.filter(report => {
//     const reportDate = new Date(report.createdAt);
//     return reportDate.getFullYear() === selectedDate.getFullYear() &&
//       reportDate.getMonth() === selectedDate.getMonth() &&
//       reportDate.getDate() === selectedDate.getDate();
//   });

//   displayReports(filteredReports);
// }

// function displayNoReportsMessage() {
//   const reportsContainer = document.querySelector('.student-report-container');
//   reportsContainer.innerHTML = `
//         <div class="text-center text-light py-5">
//             <i class="bi bi-file-earmark-text fs-1"></i>
//             <p class="mt-3">No reports found for this student</p>
//         </div>
//     `;
// }

// function showErrorToast(message) {
//   const toast = document.createElement('div');
//   toast.className = 'toast align-items-center text-white bg-danger position-fixed bottom-0 end-0 m-3';
//   toast.innerHTML = `
//         <div class="d-flex">
//             <div class="toast-body">${message}</div>
//             <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
//         </div>
//     `;
//   document.body.appendChild(toast);
//   new bootstrap.Toast(toast).show();
//   setTimeout(() => toast.remove(), 5000);
// }



// admin-student-report.js
// import { firebaseCRUD } from './firebase-crud.js';

document.addEventListener('DOMContentLoaded', async function () {


  try {
    // Get userId from URL or localStorage
    const userId = getUserIdFromUrl() || localStorage.getItem('userId');
    console.log(userId);

    if (userId) {
      await loadStudentReports(userId);
      await loadStudentData(userId); // Add this line to load student data
      await loadAttendanceData(userId); // Add this line to load attendance data


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



// Updated loadStudentData function with company image fetching
async function loadStudentData(userId) {
  try {
    const { firebaseCRUD } = await import("./firebase-crud.js");
    const students = await firebaseCRUD.queryData("students", "userId", "==", userId);

    if (!students || students.length === 0) {
      console.log("No student data found");
      return;
    }

    const studentData = students[0];

    // Update the modal with student data
    const companyNameEl = document.getElementById('company-name');
    const companyImageEl = document.querySelector('.company-container img');
    const userNameEl = document.getElementById('user-name');
    const phoneEl = document.querySelector('.phone-email-container p span');
    const emailEl = document.querySelector('.email-add');
    const phoneTooltip = document.querySelector('.phone-email-container .tt[data-bs-title]');
    const emailTooltip = document.querySelector('.phone-email-container .tt[data-bs-title="edagardobalan24@gmail.com"]');

    // Construct full name
    let fullName = studentData.firstName || '';
    if (studentData.middleName) fullName += ' ' + studentData.middleName;
    if (studentData.lastName) fullName += ' ' + studentData.lastName;
    if (studentData.suffix) fullName += ' ' + studentData.suffix;

    // Update elements
    if (companyNameEl) companyNameEl.textContent = studentData.companyName || 'Department of Agrarian Reform';
    if (userNameEl) userNameEl.textContent = fullName;

    if (phoneEl) phoneEl.textContent = studentData.phoneNumber || 'N/A';
    if (emailEl) emailEl.textContent = studentData.emailAddress || 'N/A';

    if (phoneTooltip) phoneTooltip.setAttribute('data-bs-title', studentData.phoneNumber || '');
    if (emailTooltip) emailTooltip.setAttribute('data-bs-title', studentData.emailAddress || '');

    // Fetch and display company image if company name exists
    if (studentData.companyName) {
      await loadCompanyImage(studentData.companyName, companyImageEl);
    }

  } catch (error) {
    console.error("Error loading student data:", error);
    showErrorToast("Failed to load student data: " + error.message);
  }
}




async function loadCompanyImage(companyName) {
  try {
    const imageElement = document.getElementById('image');
    if (!imageElement) {
      console.error("Image element not found");
      return;
    }

    const { firebaseCRUD } = await import("./firebase-crud.js");
    const companies = await firebaseCRUD.queryData("company", "companyName", "==", companyName);

    if (companies && companies.length > 0 && companies[0].image) {
      const base64Image = companies[0].image;
      console.log("Full Base64 image length:", base64Image.length);

      // Verify the Base64 string is complete
      if (base64Image.endsWith('==') || base64Image.endsWith('=') ||
        (base64Image.length % 4 === 0)) {
        imageElement.src = base64Image;
        imageElement.alt = `${companyName} logo`;
        console.log("Image source set successfully");

        // Add onload and onerror handlers for debugging
        imageElement.onload = () => console.log("Image loaded successfully");
        imageElement.onerror = () => {
          console.error("Error loading image");
          setDefaultImage(imageElement);
        };
      } else {
        console.error("Incomplete Base64 string");
        setDefaultImage(imageElement);
      }
    } else {
      console.log("No company image found, using default");
      setDefaultImage(imageElement);
    }
  } catch (error) {
    console.error("Error loading company image:", error);
    setDefaultImage(document.getElementById('image'));
  }
}

function setDefaultImage(imgElement) {
  if (imgElement) {
    imgElement.src = "../assets/img/Department-of-Agrarian-Reform.jpeg";
    imgElement.alt = "Default company background image";
  }
}












// // New function to load attendance data
// async function loadAttendanceData(userId) {
//   try {
//     const { firebaseCRUD } = await import("./firebase-crud.js");
//     const attendanceRecords = await firebaseCRUD.queryData("completeAttendanceTbl", "userId", "==", userId);

//     if (!attendanceRecords || attendanceRecords.length === 0) {
//       console.log("No attendance records found");
//       return;
//     }

//     // Initialize counters
//     let presentCount = 0;
//     let lateCount = 0;
//     let absentCount = 0;
//     let totalWorkHours = 0;
//     let totalMinutes = 0;

//     // Calculate statistics
//     attendanceRecords.forEach(record => {
//       if (record.isPresent === "True") {
//         presentCount++;
//         if (record.isLate === "True") {
//           lateCount++;
//         }
//       } else {
//         absentCount++;
//       }

//       // Sum up work hours and minutes
//       if (record.workHours) {
//         totalWorkHours += parseFloat(record.workHours) || 0;
//       }
//       if (record.totalMinutes) {
//         totalMinutes += parseInt(record.totalMinutes) || 0;
//       }
//     });

//     // Convert total minutes to hours and remaining minutes
//     const additionalHours = Math.floor(totalMinutes / 60);
//     const remainingMinutes = totalMinutes % 60;
//     totalWorkHours += additionalHours;

//     // Format accumulated time
//     const accumulatedTime = `${totalWorkHours}:${remainingMinutes.toString().padStart(2, '0')}:00`;

//     // Update the DOM
//     updateAttendanceDisplay(presentCount, lateCount, absentCount, accumulatedTime);

//   } catch (error) {
//     console.error("Error loading attendance data:", error);
//   }
// }

// // Helper function to update the attendance display
// function updateAttendanceDisplay(present, late, absent, accumulatedTime) {
//   // Update attendance numbers
//   const presentElement = document.querySelector('.attendance-status-container p:nth-child(1) .number');
//   const lateElement = document.querySelector('.attendance-status-container p:nth-child(2) .number');
//   const absentElement = document.querySelector('.attendance-status-container p:nth-child(3) .number');
//   const timeElement = document.querySelector('.time-life-container span');

//   if (presentElement) presentElement.textContent = present;
//   if (lateElement) lateElement.textContent = late;
//   if (absentElement) absentElement.textContent = absent;
//   if (timeElement) timeElement.textContent = accumulatedTime;
// }


// Updated function with proper time formatting
async function loadAttendanceData(userId) {
  try {
    const { firebaseCRUD } = await import("./firebase-crud.js");
    const attendanceRecords = await firebaseCRUD.queryData("completeAttendanceTbl", "userId", "==", userId);

    if (!attendanceRecords || attendanceRecords.length === 0) {
      console.log("No attendance records found");
      return;
    }

    // Initialize counters
    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    let totalWorkHours = 0;
    let totalMinutes = 0;

    // Calculate statistics
    attendanceRecords.forEach(record => {
      if (record.isPresent === "True") {
        presentCount++;
        if (record.isLate === "True") {
          lateCount++;
        }
      } else {
        absentCount++;
      }

      // Sum up work hours and minutes
      if (record.workHours) {
        totalWorkHours += parseFloat(record.workHours) || 0;
      }
      if (record.totalMinutes) {
        totalMinutes += parseInt(record.totalMinutes) || 0;
      }
    });

    // Convert all time to seconds first for accurate calculation
    const totalSeconds = (totalWorkHours * 3600) + (totalMinutes * 60);

    // Calculate hours, minutes, seconds
    const hours = Math.floor(totalSeconds / 3600);
    const remainingSeconds = totalSeconds % 3600;
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;

    // Format as HH:MM:SS with leading zeros
    const accumulatedTime = [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ].join(':');

    // Update the DOM
    updateAttendanceDisplay(presentCount, lateCount, absentCount, accumulatedTime);

  } catch (error) {
    console.error("Error loading attendance data:", error);
  }
}

// Helper function to update the attendance display (unchanged)
function updateAttendanceDisplay(present, late, absent, accumulatedTime) {
  const presentElement = document.querySelector('.attendance-status-container p:nth-child(1) .number');
  const lateElement = document.querySelector('.attendance-status-container p:nth-child(2) .number');
  const absentElement = document.querySelector('.attendance-status-container p:nth-child(3) .number');
  const timeElement = document.querySelector('.time-life-container span');

  if (presentElement) presentElement.textContent = present;
  if (lateElement) lateElement.textContent = late;
  if (absentElement) absentElement.textContent = absent;
  if (timeElement) timeElement.textContent = accumulatedTime;
}










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

async function loadStudentReports(userId) {
  try {
    const { firebaseCRUD } = await import("./firebase-crud.js");

    // Query student by userId field
    const students = await firebaseCRUD.queryData("students", "userId", "==", userId);
    if (!students || students.length === 0) throw new Error("Student not found");

    const student = students[0];
    displayStudentInfo(student);

    // Then get all reports for this student
    const reports = await firebaseCRUD.queryData("reports", "userId", "==", userId);

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

    // Load base64 images
    const images = await loadReportImages(report.id);

    const reportElement = document.createElement('div');
    reportElement.className = 'report p-3 mb-4 rounded';


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
    const imageDocs = await firebaseCRUD.getAllData(`reports/${reportId}/images`);

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
            <p class="mt-3">No reports found for this student</p>
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
















// Add this code to your existing JavaScript file, preferably near the top with other event listeners

// // Edit button click handler
// document.querySelector('[data-bs-target="#editDataModal"]')?.addEventListener('click', async function () {
//   try {
//     const userId = getUserIdFromUrl() || localStorage.getItem('userId');
//     if (!userId) throw new Error("No user ID found");

//     const { firebaseCRUD } = await import("./firebase-crud.js");

//     // Get student data
//     const students = await firebaseCRUD.queryData("students", "userId", "==", userId);
//     if (!students || students.length === 0) throw new Error("Student not found");

//     const student = students[0];

//     // Populate form fields
//     document.getElementById('user-id').value = userId;
//     document.getElementById('student-id').value = student.studentId || '';
//     document.getElementById('phone-number').value = student.phoneNumber || '';
//     document.getElementById('first-name').value = student.firstName || '';
//     document.getElementById('middle-name').value = student.middleName || '';
//     document.getElementById('last-name').value = student.lastName || '';
//     document.getElementById('sufix').value = student.suffix || '';
//     document.getElementById('gender').value = student.gender || 'male';
//     document.getElementById('address').value = student.address || '';
//     document.getElementById('company-name').value = student.companyName || '';

//     // Set time values
//     document.getElementById('morning-time-in').value = student.morningTimeIn || '';
//     document.getElementById('morning-time-out').value = student.morningTimeOut || '';
//     document.getElementById('afternoon-time-in').value = student.afternoonTimeIn || '';
//     document.getElementById('afternoon-time-out').value = student.afternoonTimeOut || '';

//     // Set user type
//     document.getElementById('user-type').value = student.userType || 'student';

//     // Set profile image if available
//     if (student.userImg) {
//       document.getElementById('user-profile-img').src = student.userImg;
//     }

//   } catch (error) {
//     console.error("Error loading student data:", error);
//     showErrorToast("Failed to load student data: " + error.message);
//   }
// });


document.querySelector('[data-bs-target="#editDataModal"]')?.addEventListener('click', async function () {
  try {
    const userId = getUserIdFromUrl() || localStorage.getItem('userId');
    if (!userId) throw new Error("No user ID found");

    const { firebaseCRUD } = await import("./firebase-crud.js");

    // Initialize dropdowns first
    await initializeDropdowns();

    // Then load and set student data
    await loadAndSetStudentData(userId);

  } catch (error) {
    console.error("Error loading student data:", error);
    showErrorToast("Failed to load student data: " + error.message);
  }
});

async function initializeDropdowns() {
  // Initialize gender dropdown
  const genderSelect = document.getElementById('gender');
  // Clear and repopulate to ensure fresh state
  genderSelect.innerHTML = `
    <option value="Male">Male</option>
    <option value="Female">Female</option>
  `;

  // Initialize company dropdown
  const companySelect = document.getElementById('companyName');
  // Clear existing options except the first empty one
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





async function loadAndSetStudentData(userId) {
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

  // Set gender selection (dropdown is already populated)
  if (student.gender) {
    document.getElementById('gender').value = student.gender;
  }

  // Set company selection (dropdown is already populated)
  if (student.companyName) {
    document.getElementById('companyName').value = student.companyName;
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