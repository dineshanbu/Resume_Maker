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
    const grid = document.getElementById('recentResumesGrid');
    
    if (!grid) return;
    
    // Remove skeleton rows
    grid.innerHTML = '';
    
    // Show only first 6 resumes
    const recentResumes = resumes.slice(0, 6);
    
    if (recentResumes.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="fas fa-file-alt"></i>
                <h4>No resumes yet</h4>
                <p>Create your first resume to get started</p>
            </div>
        `;
        return;
    }
    
    recentResumes.forEach(resume => {
        const card = document.createElement('div');
        card.className = 'resume-card';
        card.innerHTML = `
            <div class="resume-preview">
                <i class="fas fa-file-alt resume-preview-icon"></i>
            </div>
            <div class="resume-info">
                <button class="resume-menu" title="More options">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
                <div class="resume-header">
                    <h5 class="resume-title">${resume.name}</h5>
                    <p class="resume-template">${resume.template}</p>
                    <div class="resume-meta">
                        <span class="resume-date">${formatDate(resume.lastUpdated)}</span>
                    </div>
                </div>
                <div>
                    <div class="resume-progress">
                        <div class="resume-progress-bar ${resume.status}"></div>
                    </div>
                    <div class="resume-actions">
                        <button class="resume-action-btn" onclick="shareResume(${resume.id})" title="Share">
                            <i class="fas fa-share-alt"></i>
                            <span>Share</span>
                        </button>
                        <button class="resume-action-btn" onclick="duplicateResume(${resume.id})" title="Duplicate">
                            <i class="fas fa-copy"></i>
                            <span>Duplicate</span>
                        </button>
                        <button class="resume-action-btn" onclick="analyzeResume(${resume.id})" title="Analyze">
                            <i class="fas fa-chart-bar"></i>
                            <span>Analyze</span>
                        </button>
                        <button class="resume-action-btn" onclick="archiveResume(${resume.id})" title="Archive">
                            <i class="fas fa-archive"></i>
                            <span>Archive</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Share Resume
function shareResume(id) {
    showToast('Share link copied to clipboard!');
}

// Analyze Resume
function analyzeResume(id) {
    showToast('Analyzing resume...');
}

// Archive Resume
function archiveResume(id) {
    showToast('Resume archived successfully!');
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

// Initialize sample data if empty
function initializeSampleData() {
    const existingResumes = storage.get('resumes');
    if (!existingResumes || existingResumes.length === 0) {
        const sampleResumes = [
            {
                id: 1,
                name: 'Senior Frontend Developer Resume',
                template: 'Modern Professional',
                status: 'completed',
                lastUpdated: new Date(2025, 0, 10).toISOString(),
                position: 0
            },
            {
                id: 2,
                name: 'Full Stack Engineer CV',
                template: 'ATS-Friendly',
                status: 'completed',
                lastUpdated: new Date(2025, 0, 8).toISOString(),
                position: 1
            },
            {
                id: 3,
                name: 'Product Manager Resume',
                template: 'Creative Design',
                status: 'completed',
                lastUpdated: new Date(2025, 0, 5).toISOString(),
                position: 2
            },
            {
                id: 4,
                name: 'Software Architect Resume',
                template: 'Professional',
                status: 'completed',
                lastUpdated: new Date(2025, 0, 3).toISOString(),
                position: 3
            },
            {
                id: 5,
                name: 'Software Architect Resume',
                template: 'Modern Professional',
                status: 'completed',
                lastUpdated: new Date(2025, 0, 3).toISOString(),
                position: 4
            },
            {
                id: 6,
                name: 'UI/UX Designer Portfolio Creative',
                template: 'Creative Design',
                status: 'completed',
                lastUpdated: new Date(2024, 11, 28).toISOString(),
                position: 5
            }
        ];
        storage.set('resumes', sampleResumes);
    }
}

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Initialize sample data
    initializeSampleData();
    
    // Animate stat counters
    document.querySelectorAll('.stat-number').forEach(element => {
        const target = parseInt(element.dataset.target);
        setTimeout(() => {
            animateCounter(element, target);
        }, 300);
    });
    
    // Load recent resumes immediately
    loadRecentResumes();
});