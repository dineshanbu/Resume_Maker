// ========================================
// Upload Resume Page Script
// ========================================

const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const uploadProgress = document.getElementById('uploadProgress');
const uploadSuccess = document.getElementById('uploadSuccess');
let uploadedFile = null;

// Drag and Drop Events
if (uploadZone) {
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });
    
    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });
    
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });
}

// File Input Change
if (fileInput) {
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });
}

// Handle File Upload
function handleFileUpload(file) {
    // Validate file
    if (!file.type.includes('pdf')) {
        showToast('Please upload a PDF file only', 'error');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB
        showToast('File size must be less than 5MB', 'error');
        return;
    }
    
    uploadedFile = file;
    
    // Show progress
    uploadZone.style.display = 'none';
    uploadProgress.style.display = 'block';
    document.getElementById('fileName').textContent = file.name;
    
    // Simulate upload progress
    let progress = 0;
    const progressBar = document.getElementById('progressBar');
    
    const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            
            // Show success after upload complete
            setTimeout(() => {
                uploadProgress.style.display = 'none';
                uploadSuccess.style.display = 'block';
                showToast('Resume uploaded and processed successfully!');
            }, 500);
        }
        progressBar.style.width = progress + '%';
        progressBar.textContent = Math.floor(progress) + '%';
    }, 300);
}

// Convert to Editable Resume
function convertToEditable() {
    showToast('Converting to editable format...');
    setTimeout(() => {
        window.location.href = 'create-resume.html?from=upload';
    }, 1000);
}

// Reset Upload
function resetUpload() {
    uploadedFile = null;
    uploadZone.style.display = 'block';
    uploadProgress.style.display = 'none';
    uploadSuccess.style.display = 'none';
    fileInput.value = '';
}