document.addEventListener('DOMContentLoaded', function () {
    const imageInput = document.getElementById('image-input');
    const imageContainer = document.getElementById('image-container');
    const addReportForm = document.getElementById('add-report-form');

    // Initialize IndexedDB
    let db;
    const request = indexedDB.open('ReportsDB', 1);

    request.onupgradeneeded = function (event) {
        db = event.target.result;
        if (!db.objectStoreNames.contains('reports')) {
            const store = db.createObjectStore('reports', { keyPath: 'id', autoIncrement: true });
            store.createIndex('date', 'date', { unique: false });
        }
    };

    request.onsuccess = function (event) {
        db = event.target.result;
    };

    request.onerror = function (event) {
        console.error('IndexedDB error:', event.target.error);
    };

    // Handle image selection and preview
    if (imageInput && imageContainer) {
        imageInput.addEventListener('change', function (event) {
            const files = event.target.files;
            imageContainer.innerHTML = '';

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (!file.type.match('image.*')) {
                    alert(`File ${file.name} is not an image`);
                    continue;
                }
                if (file.size > 2000000) {
                    alert(`File ${file.name} is too large`);
                    continue;
                }

                const reader = new FileReader();
                reader.onload = function (e) {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.className = 'img-thumbnail me-2 mb-2';
                    img.style.maxWidth = '80px';
                    img.style.maxHeight = '80px';
                    imageContainer.appendChild(img);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Handle form submission
    if (addReportForm) {
        addReportForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const title = document.getElementById('report-title').value.trim();
            const content = document.getElementById('report-content').value.trim();

            if (!title || !content) {
                alert('Please fill in all required fields');
                return;
            }

            // Get the image files
            const imageFiles = imageInput.files;
            const imagePaths = [];

            // Store the report data in IndexedDB first
            const transaction = db.transaction(['reports'], 'readwrite');
            const store = transaction.objectStore('reports');

            // Create report data object
            const reportData = {
                title: title,
                content: content,
                date: new Date().toISOString(),
                images: [] // Will be populated after upload
            };

            // Add to IndexedDB
            const request = store.add(reportData);

            request.onsuccess = function (event) {
                const reportId = event.target.result;

                // Now handle the file upload if there are images
                if (imageFiles.length > 0) {
                    const formData = new FormData(addReportForm);
                    formData.append('reportId', reportId);

                    fetch('../php/report.php', {
                        method: 'POST',
                        body: formData,
                    })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                // Update the IndexedDB record with the image paths
                                const updateTransaction = db.transaction(['reports'], 'readwrite');
                                const updateStore = updateTransaction.objectStore('reports');
                                const getRequest = updateStore.get(reportId);

                                getRequest.onsuccess = function () {
                                    const report = getRequest.result;
                                    report.images = data.uploadedFiles;

                                    const putRequest = updateStore.put(report);
                                    putRequest.onsuccess = function () {
                                        // Close the modal
                                        const modal = bootstrap.Modal.getInstance(document.getElementById('addReportModal'));
                                        if (modal) modal.hide();

                                        // Show success and redirect
                                        alert('Report saved successfully!');
                                        window.location.href = 'report.html';
                                    };
                                };
                            } else {
                                alert('Error: ' + data.message);
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            alert('An error occurred while submitting the report.');
                        });
                } else {
                    // No images, just close and redirect
                    const modal = bootstrap.Modal.getInstance(document.getElementById('addReportModal'));
                    if (modal) modal.hide();
                    alert('Report saved successfully!');
                    window.location.href = 'report.html';
                }
            };

            request.onerror = function (event) {
                console.error('Error storing report:', event.target.error);
                alert('Error saving report to local database.');
            };
        });
    }

    // Function to display reports from IndexedDB
    function displayReports() {
        const transaction = db.transaction(['reports'], 'readonly');
        const store = transaction.objectStore('reports');
        const request = store.getAll();

        request.onsuccess = function (event) {
            const reports = event.target.result;
            const cardContainer = document.querySelector('.card-container');

            if (reports.length > 0) {
                cardContainer.innerHTML = '';

                reports.forEach(report => {
                    const date = new Date(report.date);
                    const formattedDate = date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });

                    const card = document.createElement('a');
                    card.href = '#';
                    card.className = 'report-card mb-2';
                    card.setAttribute('data-bs-toggle', 'modal');
                    card.setAttribute('data-bs-target', '#viewReportModal');
                    card.setAttribute('data-report-id', report.id);

                    card.innerHTML = `
    <span id="title" class="text-truncate" style="width: calc(100% - 10px);">${report.title}</span>
    <span id="separator"></span>
    <div class="report-content-container">
        <p class="text-truncate m-0" style="width: calc(100% - 40px);">${report.content}</p>
        <p id="date" class="text-end mt-2">${formattedDate}</p>
    </div>
    `;

                    card.addEventListener('click', function () {
                        loadReportDetails(report.id);
                    });

                    cardContainer.appendChild(card);
                });
            } else {
                cardContainer.innerHTML = '<p>No reports found</p>';
            }
        };
    }

    // Function to load report details for view modal
    function loadReportDetails(reportId) {
        const transaction = db.transaction(['reports'], 'readonly');
        const store = transaction.objectStore('reports');
        const request = store.get(reportId);

        request.onsuccess = function (event) {
            const report = event.target.result;
            if (report) {
                const viewModal = document.getElementById('viewReportModal');
                viewModal.querySelector('#report-title').value = report.title;
                viewModal.querySelector('#report-content').value = report.content;

                // Set the report ID as a data attribute on the form
                viewModal.querySelector('#update-report-form').dataset.reportId = reportId;

                // Display images if any
                const imageContainer = viewModal.querySelector('.image-container');
                imageContainer.innerHTML = ''; s

                if (report.images && report.images.length > 0) {
                    report.images.forEach(imagePath => {
                        const img = document.createElement('img');
                        img.src = imagePath;
                        img.className = 'img-thumbnail me-2 mb-2';
                        img.style.maxWidth = '80px';
                        img.style.maxHeight = '80px';
                        imageContainer.appendChild(img);
                    });
                }
            }
        };
    }

    // Initialize the page by displaying reports
    if (db) {
        displayReports();
    } else {
        // Wait for DB to be ready
        request.onsuccess = function () {
            db = request.result;
            displayReports();
        };
    }

    // Handle update report form submission
    const updateReportForm = document.getElementById('update-report-form');
    if (updateReportForm) {
        updateReportForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const reportId = this.dataset.reportId;
            const title = this.querySelector('#report-title').value.trim();
            const content = this.querySelector('#report-content').value.trim();

            if (!title || !content) {
                alert('Please fill in all required fields');
                return;
            }

            const transaction = db.transaction(['reports'], 'readwrite');
            const store = transaction.objectStore('reports');
            const getRequest = store.get(reportId);

            getRequest.onsuccess = function () {
                const report = getRequest.result;
                report.title = title;
                report.content = content;

                const putRequest = store.put(report);
                putRequest.onsuccess = function () {
                    alert('Report updated successfully!');
                    displayReports();

                    // Close the modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('viewReportModal'));
                    if (modal) modal.hide();
                };
            };
        });
    }

    // Handle delete report
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('delete-btn')) {
            e.preventDefault();
            const reportId = document.getElementById('update-report-form').dataset.reportId;

            const deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmationModal'));
            deleteModal.show();

            document.querySelector('#deleteConfirmationModal [name="delete-yes"]').onclick = function () {
                const transaction = db.transaction(['reports'], 'readwrite');
                const store = transaction.objectStore('reports');
                const deleteRequest = store.delete(parseInt(reportId));

                deleteRequest.onsuccess = function () {
                    displayReports();
                    deleteModal.hide();

                    // Also close the view modal
                    const viewModal = bootstrap.Modal.getInstance(document.getElementById('viewReportModal'));
                    if (viewModal) viewModal.hide();
                };
            };
        }
    });
});