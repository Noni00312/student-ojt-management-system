// import { firebaseCRUD } from './firebase-crud.js';

document.addEventListener("DOMContentLoaded", async function () {
    try {
      const userId = localStorage.getItem("userId");
  
      if (!userId) {
        console.error("No userId found in localStorage");
        return;
      }
  
      await window.dbReady;
  
      const img = document.getElementById("user-img");
  
      const dataArray = await crudOperations.getByIndex(
        "studentInfoTbl",
        "userId",
        userId
      );
  
      const data = Array.isArray(dataArray) ? dataArray[0] : dataArray;
  
      if (data != null) {
        img.src = data.userImg
          ? data.userImg
          : "../assets/img/icons8_male_user_480px_1";
  
      } else {
        console.warn("No user data found for this user.");
      }
    } catch (err) {
      console.error("Failed to get user data from IndexedDB", err);
    }
  });
  
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





function showError(message) {
  const container = document.querySelector(".card-container .row");
  container.innerHTML = `
        <div class="col-12 text-center py-4">
            <i class="bi bi-exclamation-triangle-fill fs-1 text-danger"></i>
            <p class="mt-2">${message}</p>
            <button class="btn btn-primary mt-2" onclick="location.reload()">Retry</button>
        </div>
    `;
}





function loadStudents() {
    showLoading(true);
    import("./firebase-crud.js")
        .then(({ firebaseCRUD }) => {
           
            firebaseCRUD.queryData("students", "userType", "==", "student")
                .then((students) => {
                  
                    firebaseCRUD.queryData("students", "userType", "==", "studentAssistant")
                        .then((assistants) => {
                            showLoading(false);
                           
                            const allUsers = [...students, ...assistants];
                            displayStudents(allUsers);
                        })
                        .catch((error) => {
                            showLoading(false);
                            console.error("Error loading assistants:", error);
                            showError("Failed to load student assistants: " + error.message);
                        });
                })
                .catch((error) => {
                    showLoading(false);
                    console.error("Error loading students:", error);
                    showError("Failed to load students: " + error.message);
                });
        })
        .catch((err) => {
            showLoading(false);
            console.error("Failed to load firebase-crud:", err);
            showError("Failed to load required modules. Please try again.");
        });
}





// function displayStudents(students) {
//     const cardContainer = document.querySelector('.card-container .row');
//     cardContainer.innerHTML = ''; 

//     if (!students || students.length === 0) {
//         cardContainer.innerHTML = `
//             <div class="position-absolute top-50 start-50 translate-middle col-12 text-center py-4">
//                 <i class="bi bi-exclamation-circle fs-1 text-muted"></i>
//                 <h6 class="mt-2">No Students Available</h6>
//                 <p class="mt-1">No students have been registered yet.</p>
//             </div>
//         `;
//         return;
//     }

//     students.forEach((student) => {
//         const colDiv = document.createElement('div');
//         colDiv.className = 'col-lg-4 col-md-6 px-2';

//         colDiv.innerHTML = `
//             <div class="student-card h-100" data-student-id="${student.userId}">
//                 <div class="d-flex align-items-center text-decoration-none h-100">
//                     <div class="img-container me-3 flex-shrink-0">
//                         ${student.userImg ?
//                             `<img src="${student.userImg}" alt="${student.firstName}">` :
//                             `<img src="../assets/img/icons8_male_user_480px_1.png" alt="Default user">`
//                         }
//                     </div>
//                     <div class="main-container w-100 overflow-hidden">
//                         <div class="name-id-container d-flex justify-content-between">
//                             <p class="m-0 text-truncate fw-bold">${student.firstName + " " + (student.middleName ? student.middleName + " " : "") + student.lastName + (student.suffix ? " " + student.suffix : "") || 'No name'}</p>
//                             <p class="m-0 ms-2 text-nowrap">${student.studentId || 'No ID'}</p>
//                             <p class="d-none">${student.userId || ''}</p>
//                         </div>
//                         <div class="separator my-2"></div>
//                         <div class="company">
//                             <p class="m-0 text-truncate">${student.companyName || 'No company'}</p>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         `;

//         // Add click event to show documents modal
//         const studentCard = colDiv.querySelector('.student-card');
//         studentCard.addEventListener('click', function() {
//             const studentId = this.getAttribute('data-student-id');
//             showDocumentsModal(studentId);
//         });

//         cardContainer.appendChild(colDiv);
//     });
// }




// New function to show only OJT Kits
function showOjtKitsModal() {
    showLoading(true);
    
    import("./firebase-crud.js")
        .then(({ firebaseCRUD }) => {
            return firebaseCRUD.getAllData('ojtKits');
        })
        .then((ojtKits) => {
            const modal = document.getElementById('documentsModal');
            const optionsContainer = document.querySelector('#documentsModal .d-flex.flex-column.gap-3');
            
            // Update modal title
            document.getElementById('documentsModalLabel').textContent = 'OJT Kits';
            optionsContainer.innerHTML = '';
            
            if (ojtKits && ojtKits.length > 0) {
                ojtKits.forEach((kit) => {
                    const container = document.createElement('div');
                    container.className = 'd-flex align-items-center justify-content-between';
                    
                    container.innerHTML = `
                        <button class="document-option-btn d-flex align-items-center p-3 flex-grow-1" data-ojt-kit-id="${kit.id}">
                            <div class="icon-container bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px;">
                                <i class="bi bi-file-earmark-text-fill text-white"></i>
                            </div>
                            <span class="text-white">${kit.title || 'Untitled Kit'}</span>
                        </button>
                        <div class="d-flex ms-2">
                            <button class="btn btn-sm btn-outline-warning me-2 edit-kit" data-kit-id="${kit.id}">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger delete-kit" data-kit-id="${kit.id}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    `;
                    
                    // Add click handlers
                    container.querySelector('.document-option-btn').addEventListener('click', function() {
                        const kitId = this.getAttribute('data-ojt-kit-id');
                        handleOjtKitSelection(null, kitId); // Pass null for studentId
                    });
                    
                    container.querySelector('.edit-kit').addEventListener('click', (e) => {
                        e.stopPropagation();
                        loadOjtKitForEdit(kit.id);
                    });
                    
                    container.querySelector('.delete-kit').addEventListener('click', (e) => {
                        e.stopPropagation();
                        deleteOjtKit(kit.id);
                    });
                    
                    optionsContainer.appendChild(container);
                });
            } else {
                optionsContainer.innerHTML = `
                    <div class="text-center text-white py-3">
                        <i class="bi bi-exclamation-circle fs-4"></i>
                        <p class="mt-2">No OJT Kits available</p>
                    </div>
                `;
            }
            
            // Show modal
            new bootstrap.Modal(modal).show();
            showLoading(false);
        })
        .catch((error) => {
            console.error('Error loading OJT Kits:', error);
            showToast('danger', 'Failed to load OJT Kits');
            showLoading(false);
        });
}

// Floating button click handler
document.getElementById('floatingActionBtn').addEventListener('click', showOjtKitsModal);




// Remove student click handler from displayStudents
function displayStudents(students) {
    const cardContainer = document.querySelector('.card-container .row');
    cardContainer.innerHTML = '';

    if (!students || students.length === 0) {
        cardContainer.innerHTML = `
            <div class="position-absolute top-50 start-50 translate-middle col-12 text-center py-4">
                <i class="bi bi-exclamation-circle fs-1 text-muted"></i>
                <h6 class="mt-2">No Students Available</h6>
                <p class="mt-1">No students have been registered yet.</p>
            </div>
        `;
        return;
    }

    students.forEach((student) => {
        const colDiv = document.createElement('div');
        colDiv.className = 'col-lg-4 col-md-6 px-2';

        colDiv.innerHTML = `
            <div class="student-card h-100" data-student-id="${student.userId}">
                <div class="d-flex align-items-center text-decoration-none h-100">
                    <div class="img-container me-3 flex-shrink-0">
                        ${student.userImg ?
                            `<img src="${student.userImg}" alt="${student.firstName}">` :
                            `<img src="../assets/img/icons8_male_user_480px_1.png" alt="Default user">`
                        }
                    </div>
                    <div class="main-container w-100 overflow-hidden">
                        <div class="name-id-container d-flex justify-content-between">
                            <p class="m-0 text-truncate fw-bold">${student.firstName + " " + (student.middleName ? student.middleName + " " : "") + student.lastName + (student.suffix ? " " + student.suffix : "") || 'No name'}</p>
                            <p class="m-0 ms-2 text-nowrap">${student.studentId || 'No ID'}</p>
                            <p class="d-none">${student.userId || ''}</p>
                        </div>
                        <div class="separator my-2"></div>
                        <div class="company">
                            <p class="m-0 text-truncate">${student.companyName || 'No company'}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        cardContainer.appendChild(colDiv);
    });
}



// Function to show documents modal with student ID and load OJT Kits
function showDocumentsModal(studentId) {
    showLoading(true);
    
    // First try to get student info from the students collection
    import("./firebase-crud.js")
        .then(({ firebaseCRUD }) => {
            // Try to get student data from the students collection
            return firebaseCRUD.queryData('students', 'userId', '==', studentId)
                .then((students) => {
                    if (!students || students.length === 0) {
                        throw new Error('Student not found');
                    }
                    
                    const student = students[0];
                    
                    // Update modal title with student name
                    const modalTitle = document.getElementById('documentsModalLabel');
                    modalTitle.textContent = `Documents for ${student.firstName} ${student.lastName}`;
                    
                    // Store the student ID in the modal for later use
                    const modal = document.getElementById('documentsModal');
                    modal.setAttribute('data-student-id', studentId);
                    
                    // Now load OJT Kits
                    return firebaseCRUD.getAllData('ojtKits');
                });
        })
        
        .then((ojtKits) => {
            // Clear existing buttons
            const optionsContainer = document.querySelector('#documentsModal .d-flex.flex-column.gap-3');
            optionsContainer.innerHTML = '';
            
            // Add OJT Kits as options
            if (ojtKits && ojtKits.length > 0) {
                ojtKits.forEach((kit) => {
                    
                    const container = document.createElement('div');
                    container.className = 'd-flex align-items-center justify-content-between';
                    
                    const button = document.createElement('button');
                    button.className = 'document-option-btn d-flex align-items-center p-3 flex-grow-1';
                    button.setAttribute('data-ojt-kit-id', kit.id);
                    
                    button.innerHTML = `
                        <div class="icon-container bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px;">
                            <i class="bi bi-file-earmark-text-fill text-white"></i>
                        </div>
                        <span class="text-white">${kit.title || 'Untitled Kit'}</span>
                    `;
                    
                    // Add click handler for selecting the kit
                    button.addEventListener('click', function() {
                        const kitId = this.getAttribute('data-ojt-kit-id');
                        const studentId = document.getElementById('documentsModal').getAttribute('data-student-id');
                        handleOjtKitSelection(studentId, kitId);
                    });
                    
                    // Create action buttons container
                    const actionButtons = document.createElement('div');
                    actionButtons.className = 'd-flex ms-2';
                    
                    // Edit button
                    const editBtn = document.createElement('button');
                    editBtn.className = 'btn btn-sm btn-outline-warning me-2';
                    editBtn.innerHTML = '<i class="bi bi-pencil"></i>';
                    editBtn.addEventListener('click', (e) => {
                        e.stopPropagation(); // Prevent triggering the main button click
                        loadOjtKitForEdit(kit.id);
                    });
                    
                    // Delete button
                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'btn btn-sm btn-outline-danger';
                    deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
                    deleteBtn.addEventListener('click', (e) => {
                        e.stopPropagation(); // Prevent triggering the main button click
                        deleteOjtKit(kit.id);
                    });
                    
                    // Append buttons to container
                    actionButtons.appendChild(editBtn);
                    actionButtons.appendChild(deleteBtn);
                    
                    container.appendChild(button);
                    container.appendChild(actionButtons);
                    optionsContainer.appendChild(container);
                });
            } else {
                // Show message if no OJT Kits available
                optionsContainer.innerHTML = `
                    <div class="text-center text-white py-3">
                        <i class="bi bi-exclamation-circle fs-4"></i>
                        <p class="mt-2">No OJT Kits available</p>
                    </div>
                `;
            }
            
            // Show the modal
            const bsModal = new bootstrap.Modal(document.getElementById('documentsModal'));
            bsModal.show();
            
            showLoading(false);
        })
        .catch((error) => {
            console.error('Error loading documents:', error);
            // showToast('danger', 'Failed to load student information or OJT Kits');
            showLoading(false);
        });
}





// Function to handle update form submission
document.getElementById('update-report-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const title = document.getElementById('update-report-title').value.trim();
    const content = document.getElementById('update-report-content').value.trim();
    
    if (!title || !content) {
        showToast('warning', 'Please fill in all fields');
        return;
    }
    
    if (!currentEditingKitId) {
        showToast('danger', 'No OJT Kit selected for editing');
        return;
    }
    
    const submitButton = document.getElementById('update-report-button');
    const originalButtonText = submitButton.innerHTML;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Updating...';
    submitButton.disabled = true;
    
    import("./firebase-crud.js")
        .then(({ firebaseCRUD }) => {
            return firebaseCRUD.updateData('ojtKits', currentEditingKitId, {
                title: title,
                content: content,
                lastUpdated: new Date().toISOString()
            });
        })
        .then(() => {
            showToast('success', 'OJT Kit updated successfully!');
            
            // Close the edit modal
            const editModal = bootstrap.Modal.getInstance(document.getElementById('addOJTKITSModalEdit'));
            editModal.hide();
            
            // Refresh the documents modal if it's open
            const docsModal = document.getElementById('documentsModal');
            if (docsModal.getAttribute('data-student-id')) {
                const studentId = docsModal.getAttribute('data-student-id');
                showDocumentsModal(studentId);
            }
            
            // Reset the form
            this.reset();
            currentEditingKitId = null;
        })
        .catch((error) => {
            console.error('Error updating OJT Kit:', error);
            showToast('danger', `Error: ${error.message}`);
        })
        .finally(() => {
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
        });
});

// Function to load OJT Kit for editing
function loadOjtKitForEdit(kitId) {
    showLoading(true);
    
    import("./firebase-crud.js")
        .then(({ firebaseCRUD }) => {
            return firebaseCRUD.getDataById('ojtKits', kitId);
        })
        .then((kit) => {
            // Close the documents modal if it's open
            const docsModal = bootstrap.Modal.getInstance(document.getElementById('documentsModal'));
            if (docsModal) {
                docsModal.hide();
            }
            
            // Populate the edit modal
            document.getElementById('update-report-title').value = kit.title || '';
            document.getElementById('update-report-content').value = kit.content || '';
            
            // Store the kit ID for the update operation
            currentEditingKitId = kit.id;
            
            // Show the edit modal
            const editModal = new bootstrap.Modal(document.getElementById('addOJTKITSModalEdit'));
            editModal.show();
            
            showLoading(false);
        })
        .catch((error) => {
            console.error('Error loading kit for edit:', error);
            showToast('danger', 'Failed to load OJT Kit for editing');
            showLoading(false);
        });
}

// Reset the editing state when modal is closed
document.getElementById('addOJTKITSModalEdit').addEventListener('hidden.bs.modal', function() {
    currentEditingKitId = null;
    document.getElementById('update-report-form').reset();
});






// Function to delete an OJT Kit
function deleteOjtKit(kitId) {
    if (!confirm('Are you sure you want to delete this OJT Kit?')) {
        return;
    }
    
    showLoading(true);
    
    import("./firebase-crud.js")
        .then(({ firebaseCRUD }) => {
            return firebaseCRUD.deleteData('ojtKits', kitId);
        })
        .then(() => {
            showToast('danger', 'OJT Kit deleted successfully');
            
            // Close the documents modal
            const docsModal = bootstrap.Modal.getInstance(document.getElementById('documentsModal'));
            if (docsModal) {
                docsModal.hide();
            }
            
            // Refresh the data (optional - if you want to reload the page or refresh a list)
            // loadOjtKits(); // Uncomment this if you want to refresh a list after deletion
        })
        .catch((error) => {
            console.error('Error deleting kit:', error);
            showToast('danger', 'Failed to delete OJT Kit');
        })
        .finally(() => {
            showLoading(false);
        });
}









// Function to handle when an OJT Kit is selected
function handleOjtKitSelection(studentId, kitId) {
    showLoading(true);
    
    import("./firebase-crud.js")
        .then(({ firebaseCRUD }) => {
            // Get both student and kit data
            return Promise.all([
                // Query student by userId
                firebaseCRUD.queryData('students', 'userId', '==', studentId)
                    .then(students => {
                        if (!students || students.length === 0) {
                            throw new Error('Student not found');
                        }
                        return students[0];
                    }),
                // Get OJT Kit by ID
                firebaseCRUD.getDataById('ojtKits', kitId)
            ]);
        })
        .then(([student, kit]) => {
            // Here you can implement what happens when a kit is selected
            // For example, you might want to:
            // 1. Assign this kit to the student
            // 2. Show a preview of the kit
            // 3. Log the assignment
            
            // Example implementation - just showing a success message
            showToast('success', `Selected "${kit.title}" for ${student.firstName} ${student.lastName}`);
            
            // Close the modal
            const bsModal = bootstrap.Modal.getInstance(document.getElementById('documentsModal'));
            // bsModal.hide();
            
            showLoading(false);
        })
        .catch((error) => {
            console.error('Error handling selection:', error);
            showToast('danger', 'Failed to process selection: ' + error.message);
            showLoading(false);
        });
}




function searchStudents(searchTerm) {
    showLoading(true);
    import("./firebase-crud.js")
        .then(({ firebaseCRUD }) => {
            
            firebaseCRUD.queryData("students", "userType", "==", "student")
                .then((students) => {
                    
                    firebaseCRUD.queryData("students", "userType", "==", "studentAssistant")
                        .then((assistants) => {
                            showLoading(false);
                            
                            const allUsers = [...students, ...assistants];
                           
                            const filtered = allUsers.filter(user =>
                                (user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                user.studentId?.includes(searchTerm) ||
                                user.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                user.middleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()))
                            );
                            displayStudents(filtered);
                        })
                        .catch((error) => {
                            showLoading(false);
                            console.error("Error fetching assistants:", error);
                            showError("Error searching assistants: " + error.message);
                        });
                })
                .catch((error) => {
                    showLoading(false);
                    console.error("Error fetching students:", error);
                    showError("Error searching students: " + error.message);
                });
        })
        .catch((err) => {
            showLoading(false);
            console.error("Failed to load firebase-crud:", err);
            showError("Failed to load required modules. Please try again.");
        });
}

$(document).ready(function () {
    loadStudents();

    
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





// Global variable to store the currently edited OJT Kit ID
let currentEditingKitId = null;

// Function to show toast messages
function showToast(type, message) {
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} position-fixed bottom-0 end-0 m-3`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    document.body.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}










// Add OJT Kit Form Submission
document.getElementById('add-report-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const title = document.getElementById('add-report-title').value;
    const content = document.getElementById('add-report-content').value;
    
    if (!title || !content) {
        showToast('warning', 'Please fill in all fields');
        return;
    }
    
    const submitButton = document.getElementById('add-report-button');
    const originalButtonText = submitButton.innerHTML;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Adding...';
    submitButton.disabled = true;
    
    try {
        const { firebaseCRUD } = await import("./firebase-crud.js");
        await firebaseCRUD.createData('ojtKits', {
            title: title,
            content: content,
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        });
        
        // Get and hide the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addOJTKITSModal'));
        modal.hide();
        
        // Reset the form
        this.reset();
        
        showToast('success', 'OJT Kit added successfully!');
        
    } catch (error) {
        console.error('Error adding OJT Kit:', error);
        showToast('danger', `Error: ${error.message}`);
    } finally {
        submitButton.innerHTML = originalButtonText;
        submitButton.disabled = false;
    }
});








// Track selected student
let selectedStudentId = null;

// Add click handler for floating button
document.getElementById('floatingActionBtn').addEventListener('click', function() {
    if (!selectedStudentId) {
        // showToast('warning', 'Please select a student first');
        return;
    }
    showDocumentsModal(selectedStudentId);
});
