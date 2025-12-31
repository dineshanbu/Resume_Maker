// ========================================
// Dashboard Page Script
// ========================================

// Animate Stats Counter
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(start);
        }
    }, 16);
}

// Load Recent Resumes
function loadRecentResumes() {
    const resumes = storage.get('resumes') || [];
    const tableBody = document.getElementById('recentResumesTable');
    
    if (!tableBody) return;
    
    // Remove skeleton rows
    tableBody.innerHTML = '';
    
    // Show only first 5 resumes
    const recentResumes = resumes.slice(0, 5);
    
    if (recentResumes.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4">
                    <p class="text-muted mb-0">No resumes yet. Create your first resume!</p>
                </td>
            </tr>
        `;
        return;
    }
    
    recentResumes.forEach(resume => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <strong>${resume.name}</strong>
            </td>
            <td>${resume.template}</td>
            <td>${formatDate(resume.lastUpdated)}</td>
            <td>
                <span class="badge ${resume.status === 'completed' ? 'bg-success' : 'bg-warning'}">
                    ${resume.status === 'completed' ? 'Completed' : 'Draft'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editResume(${resume.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-secondary" onclick="duplicateResume(${resume.id})">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteResume(${resume.id})">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="btn btn-sm btn-outline-success" onclick="downloadResume(${resume.id})">
                    <i class="fas fa-download"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Edit Resume
function editResume(id) {
    showToast('Opening resume editor...');
    setTimeout(() => {
        window.location.href = 'create-resume.html?id=' + id;
    }, 500);
}

// Duplicate Resume
function duplicateResume(id) {
    const resumes = storage.get('resumes') || [];
    const resume = resumes.find(r => r.id === id);
    
    if (resume) {
        const newResume = {
            ...resume,
            id: Date.now(),
            name: resume.name + ' (Copy)',
            lastUpdated: new Date().toISOString()
        };
        resumes.push(newResume);
        storage.set('resumes', resumes);
        showToast('Resume duplicated successfully!');
        loadRecentResumes();
    }
}

// Delete Resume
function deleteResume(id) {
    if (confirm('Are you sure you want to delete this resume?')) {
        let resumes = storage.get('resumes') || [];
        resumes = resumes.filter(r => r.id !== id);
        storage.set('resumes', resumes);
        showToast('Resume deleted successfully!');
        loadRecentResumes();
    }
}

// Download Resume (Mock)
function downloadResume(id) {
    showToast('Downloading resume...');
    // In real app, this would generate and download PDF
}

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Animate stat counters
    document.querySelectorAll('.stat-number').forEach(element => {
        const target = parseInt(element.dataset.target);
        setTimeout(() => {
            animateCounter(element, target);
        }, 300);
    });
    
    // Load recent resumes after skeleton animation
    setTimeout(() => {
        loadRecentResumes();
    }, 1000);
});