




const cardContainer = document.querySelector('.card-container');
const searchInput = document.getElementById('companySearch');




document.addEventListener('DOMContentLoaded', async function() {
    try {
        const userId = localStorage.getItem("userId");
        if (!userId) {
            console.error("No userId found in localStorage");
            return;
        }

        await window.dbReady;

        const img = document.getElementById("user-profile");
        const dataArray = await crudOperations.getByIndex("studentInfoTbl", "userId", userId);
        const data = Array.isArray(dataArray) ? dataArray[0] : dataArray;

        if (data != null) {
            img.src = data.userImg ? data.userImg : "../assets/img/icons8_male_user_480px_1";
        }

        await loadOJTKits();
        
        setupEventListeners();
    } catch (err) {
        console.error("Failed to initialize page:", err);
    }
});




async function loadOJTKits(kits = null) {
    try {
        const userId = localStorage.getItem("userId");
        if (!userId) {
            console.error("No userId found in localStorage");
            return;
        }

        cardContainer.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>';
        
        if (!kits) {
            const { firebaseCRUD } = await import("./firebase-crud.js");
            kits = await firebaseCRUD.getAllData("ojtKits");
        }
        
        const completedKits = await getCompletedKits(userId);
        
        cardContainer.innerHTML = '';
        
        if (!kits || kits.length === 0) {
            cardContainer.innerHTML = `
                <div class="position-absolute top-50 start-50 translate-middle col-12 text-center py-4">
                    <i class="bi bi-exclamation-circle fs-1 text-muted"></i>
                    <h6 class="mt-2">No OJT Kits Available</h6>
                    <p class="mt-1">No OJT Kits have been added yet.</p>
                </div>
            `;
            return;
        }
        
        const container = document.createElement('div');
        container.className = 'ojt-kits-container';
        
        kits.forEach(kit => {
            const isCompleted = completedKits.includes(kit.id);
            
            const card = document.createElement('div');
            card.className = `ojt-kit-card ${isCompleted ? 'completed' : ''}`;
            
            card.innerHTML = `
                <div class="ojt-kit-icon">
                    <i class="${getIconForKit(kit.title)}"></i>
                </div>
                <div class="ojt-kit-title">${kit.title || 'No title'}</div>
                ${isCompleted ? '<div class="completed-badge"><i class="bi bi-check-circle-fill"></i></div>' : ''}
            `;
            
            if (!isCompleted) {
                card.addEventListener('click', () => showKitDetails(kit));
            } else {
                card.style.cursor = 'default';
            }
            container.appendChild(card);
        });
        
        cardContainer.appendChild(container);
    } catch (error) {
        console.error('Error loading OJT Kits:', error);
        cardContainer.innerHTML = `
            <div class="d-flex justify-content-center align-items-center" style="min-height: 50vh;">
                <div class="text-center">
                    <i class="bi bi-exclamation-triangle-fill fs-1 text-danger"></i>
                    <p class="mt-3 fs-5">Error loading OJT Kits: ${error.message}</p>
                    <button class="btn btn-primary mt-3" onclick="loadOJTKits()">Retry</button>
                </div>
            </div>
        `;
    }
}

function getIconForKit(title) {
    if (!title) return 'bi bi-file-earmark-text';
    
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('medical')) return 'bi bi-file-medical';
    if (lowerTitle.includes('waiver')) return 'bi bi-file-earmark-text';
    if (lowerTitle.includes('payment')) return 'bi bi-cash-coin';
    return 'bi bi-file-earmark-text';
}








async function getCompletedKits(userId) {
    try {
        const { firebaseCRUD } = await import("./firebase-crud.js");
        const reports = await firebaseCRUD.getAllData("reports2");
        
        const completedKits = reports
            .filter(report => report.userId === userId && report.ojtKitId)
            .map(report => report.ojtKitId);
        
        return [...new Set(completedKits)];
    } catch (error) {
        console.error("Error fetching completed kits:", error);
        return [];
    }
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}



async function showKitDetails(kit) {
    showLoading(true);
    try {
        const modal = document.getElementById('addReportModal');
        if (!modal) {
            throw new Error("Modal element not found");
        }

        modal.dataset.viewingKit = JSON.stringify(kit);

        let titleDisplay = modal.querySelector('#ojt-kit-title-display');
        if (!titleDisplay) {
            titleDisplay = document.createElement('h5');
            titleDisplay.id = 'ojt-kit-title-display';
            titleDisplay.className = 'text-white mb-3';
            modal.querySelector('form').insertBefore(titleDisplay, modal.querySelector('form').firstChild);
        }
        titleDisplay.textContent = kit.title || 'OJT Kit Details';

        const titleInput = modal.querySelector('#ojt-kit-title');
        if (titleInput) {
            titleInput.style.display = 'none';
            titleInput.value = kit.title || ''; 
        }

        const contentField = modal.querySelector('#ojt-kit-content');
        if (contentField) {
            contentField.value = kit.content || '';
            contentField.readOnly = true;
            contentField.placeholder = 'OJT Kit content';
        }

        const imageContainer = modal.querySelector('#add-image-container');
        if (imageContainer) {
            imageContainer.innerHTML = '';
            
            if (kit.image) {
                const img = document.createElement('img');
                img.src = kit.image;
                img.className = 'img-thumbnail';
                img.style.maxWidth = '100%';
                img.style.maxHeight = '200px';
                imageContainer.appendChild(img);
            } else {
                const noImage = document.createElement('div');
                noImage.className = 'no-image-placeholder d-flex align-items-center justify-content-center';
                noImage.style.width = '100%';
                noImage.style.height = '100%';
                noImage.innerHTML = '<i class="bi bi-file-earmark-text fs-1 text-muted"></i>';
                imageContainer.appendChild(noImage);
            }
        }

        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();

    } catch (error) {
        console.error("Error showing kit details:", error);
        showErrorToast("Failed to load OJT Kit details");
    } finally {
        showLoading(false);
    }
}



document.getElementById('addReportModal')?.addEventListener('hidden.bs.modal', function () {
    const modal = this;
  

    const titleDisplay = modal.querySelector('#ojt-kit-title-display');
    if (titleDisplay) titleDisplay.remove();
    
    const titleInput = modal.querySelector('#ojt-kit-title');
    if (titleInput) {
        titleInput.style.display = 'block';
        titleInput.value = '';
    }
    
    delete modal.dataset.viewingKit;
    
    const imageContainer = modal.querySelector('#add-image-container');
    if (imageContainer) imageContainer.innerHTML = '';
});





async function loadOJTKitDataForView(kitId) {
    showLoading(true);
    try {
        const { firebaseCRUD } = await import("./firebase-crud.js");
        const kit = await firebaseCRUD.getDataById("ojtKits", kitId);
        
        const viewModal = document.getElementById('updateOJTKitModal');
        const titleInput = viewModal.querySelector('[name="ojtKitTitleU"]');
        const contentInput = viewModal.querySelector('[name="ojtKitContentU"]');
        const previewImage = viewModal.querySelector('#update-preview-image');
        const cameraIcon = viewModal.querySelector('#update-camera-icon');
        
        if (!titleInput || !contentInput || !previewImage || !cameraIcon) {
            throw new Error("Required form elements not found");
        }
        
        titleInput.value = kit.title || '';
        contentInput.value = kit.content || '';
        
        if (kit.image) {
            previewImage.src = kit.image;
            previewImage.style.display = 'block';
            cameraIcon.style.display = 'none';
        } else {
            previewImage.style.display = 'none';
            cameraIcon.style.display = 'block';
        }
        
        viewModal.setAttribute('data-kit-id', kitId);
    } catch (error) {
        console.error("Error loading OJT Kit data:", error);
        showErrorToast("Failed to load OJT Kit data");
    } finally {
        showLoading(false);
    }
}



function setupEventListeners() {
    if (searchInput) {
        const debouncedSearch = debounce(function() {
            const searchTerm = searchInput.value.trim();
            if (searchTerm.length > 0) {
                searchOJTKits(searchTerm);
            } else {
                loadOJTKits();
            }
        }, 500); 
        
        searchInput.addEventListener("input", debouncedSearch);
    }
}



async function searchOJTKits(searchTerm) {
    showLoading(true);
    try {
        const { firebaseCRUD } = await import("./firebase-crud.js");
        const allKits = await firebaseCRUD.getAllData("ojtKits");
        
        const searchTerms = searchTerm.toLowerCase().split(/\s+/).filter(term => term.length > 0);
        
        if (searchTerms.length === 0) {
            await loadOJTKits();
            return;
        }
        
        const filtered = allKits.filter(kit => {
            const kitTitle = kit.title?.toLowerCase() || '';
            
            return searchTerms.every(term => 
                kitTitle.includes(term)
            );
        });
        
        if (filtered.length === 0) {
            cardContainer.innerHTML = `
                <div class="position-absolute top-50 start-50 translate-middle col-12 text-center py-4">
                    <i class="bi bi-search fs-1 text-muted"></i>
                    <h6 class="mt-2">No results found</h6>
                    <p class="mt-1">No OJT Kits match your search for "${searchTerm}"</p>
                </div>
            `;
        } else {
            await loadOJTKits(filtered); 
        }
    } catch (error) {
        console.error("Error searching OJT Kits:", error);
        showError("Failed to search OJT Kits");
    } finally {
        showLoading(false);
    }
}

async function handleAddOJTKit() {
    const submitButton = document.getElementById('addOJTKitButton');
    const title = document.getElementById('ojt-kit-title-display').value.trim();
    const content = document.getElementById('ojtKitContent').value.trim();
    
    if (!title || !content) {
        showErrorToast("Please fill in all required fields");
        return;
    }
    
    submitButton.disabled = true;
    submitButton.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Adding...
    `;
    
    try {
        const { firebaseCRUD } = await import("./firebase-crud.js");
        
        const kitData = {
            title: title,
            content: content,
            image: uploadedImageBase64 || "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        await firebaseCRUD.createData("ojtKits", kitData);
        
        showErrorToast("OJT Kit added successfully!", "success");
        document.getElementById('addOJTKitForm').reset();
        document.getElementById('preview-image').style.display = 'none';
        document.getElementById('camera-icon').style.display = 'block';
        uploadedImageBase64 = "";
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('addOJTKITSModal'));
        modal.hide();
        
        await loadOJTKits();
    } catch (error) {
        console.error("Error adding OJT Kit:", error);
        showErrorToast("Failed to add OJT Kit");
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Add OJT Kit";
    }
}



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
        loader.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
        
        const container = document.querySelector(".card-container") || document.body;
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

function showErrorToast(message, type = 'danger') {
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} position-fixed bottom-0 end-0 m-3`;
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


let uploadedImageBase64 = "";

document.addEventListener('DOMContentLoaded', function() {
    const addImageInput = document.getElementById('add-image-input');
    if (addImageInput) {
        addImageInput.addEventListener('change', handleImageUpload);
    }
    
    const ojtKitForm = document.getElementById('ojtKitForm');
    if (ojtKitForm) {
        ojtKitForm.addEventListener('submit', handleOJTKitSubmit);
    }
});



let uploadedImages = [];

function handleImageUpload(event) {
    const files = event.target.files;
    const previewImageContainer = document.getElementById('add-image-container');
    
    if (!files || !previewImageContainer) return;
    
    uploadedImages = [];
    previewImageContainer.innerHTML = '';
    
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            try {
                let imageData = e.target.result;
                
                if (file.size > 1048576) {
                    imageData = await compressImage(imageData);
                }
                
                uploadedImages.push(imageData);
                
                const imgContainer = document.createElement('div');
                imgContainer.className = 'image-preview-container';
                
                const img = document.createElement('img');
                img.src = imageData;
                img.className = 'img-thumbnail';
                img.style.maxWidth = '100px';
                img.style.maxHeight = '100px';
                img.style.marginRight = '5px';
                img.style.marginBottom = '5px';
                
                imgContainer.appendChild(img);
                previewImageContainer.appendChild(imgContainer);
            } catch (error) {
                console.error("Error processing image:", error);
                showErrorToast("Error processing one or more images");
            }
        };
        
        reader.readAsDataURL(file);
    });
}

function compressImage(imageData, quality = 0.7) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = imageData;
        
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            const maxWidth = 1024;
            const maxHeight = 1024;
            let width = img.width;
            let height = img.height;
            
            if (width > maxWidth) {
                height *= maxWidth / width;
                width = maxWidth;
            }
            
            if (height > maxHeight) {
                width *= maxHeight / height;
                height = maxHeight;
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            const compressedData = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedData);
        };
        
        img.onerror = function() {
            resolve(imageData);
        };
    });
}






async function handleOJTKitSubmit(e) {
    e.preventDefault();
    
    const modal = document.getElementById('addReportModal');
    const submitButton = document.getElementById('add-ojtkit-button');
    const titleInput = document.getElementById('ojt-kit-title');
    const contentInput = document.getElementById('ojt-kit-content');
    const userId = localStorage.getItem("userId");
    
    if (!modal || !submitButton || !titleInput || !contentInput || !userId) {
        showErrorToast("Missing required information");
        return;
    }
    
    const isViewing = modal.dataset.viewingKit ? true : false;
    
    let title, content, ojtKitId = null;
    
    if (isViewing) {
        const kit = JSON.parse(modal.dataset.viewingKit);
        title = kit.title || '';
        content = contentInput.value.trim();
        ojtKitId = kit.id;
    } else {
        title = titleInput.value.trim();
        content = contentInput.value.trim();
    }
    
    if (!title || !content) {
        showErrorToast("Please fill in all required fields");
        return;
    }
    
    // Set loading state
    submitButton.disabled = true;
    submitButton.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Adding...
    `;
    
    try {
        const reportData = {
            title: title,
            content: content,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userId: userId,
            ojtKitId: ojtKitId,
            imageCount: uploadedImages.length 
        };
        
        const reportId = `${userId}_${Date.now()}`;
        
        const { firebaseCRUD } = await import("./firebase-crud.js");
        
        await firebaseCRUD.setDataWithId("reports2", reportId, reportData);
        
        if (uploadedImages.length > 0) {
            for (const imageData of uploadedImages) {
                const imageDocData = {
                    image: imageData,
                    ojtKitId: ojtKitId,
                    userId: userId,
                    createdAt: new Date().toISOString()
                };
                
                await firebaseCRUD.createData(`reports2/${reportId}/images`, imageDocData);
            }
        }
        
        showErrorToast("Document added successfully!", "success");
        
        document.getElementById('ojtKitForm').reset();
        document.getElementById('add-image-container').innerHTML = '';
        uploadedImages = [];
        
        delete modal.dataset.viewingKit;
        
        const modalInstance = bootstrap.Modal.getInstance(modal);
        modalInstance.hide();
        
        await loadOJTKits();
        
    } catch (error) {
        console.error("Error adding report:", error);
        showErrorToast("Failed to add report");
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Add OJT Kit";
    }
}