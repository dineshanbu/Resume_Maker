// ========================================
// My Resumes Page Script
// ========================================

let currentResumes = [];
let selectedResumeId = null;

// Load All Resumes
function loadResumes(filter = {}) {
    const resumes = storage.get('resumes') || [];
    const resumeGrid = document.getElementById('resumeGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (!resumeGrid) return;
    
    // Apply filters
    let filteredResumes = resumes;
    
    if (filter.status && filter.status !== 'all') {
        filteredResumes = filteredResumes.filter(r => r.status === filter.status);
    }
    
    if (filter.template && filter.template !== 'all') {
        filteredResumes = filteredResumes.filter(r => r.template.toLowerCase().includes(filter.template));
    }
    
    if (filter.search) {
        const searchTerm = filter.search.toLowerCase();
        filteredResumes = filteredResumes.filter(r => 
            r.name.toLowerCase().includes(searchTerm) ||
            r.template.toLowerCase().includes(searchTerm)
        );
    }
    
    currentResumes = filteredResumes;
    
    // Show/hide empty state
    if (filteredResumes.length === 0) {
        resumeGrid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    } else {
        resumeGrid.style.display = 'flex';
        emptyState.style.display = 'none';
    }
    
    // Render resume cards
    resumeGrid.innerHTML = '';
    filteredResumes.forEach(resume => {
        const card = createResumeCard(resume);
        resumeGrid.appendChild(card);
    });
}

// Create Resume Card
function createResumeCard(resume) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';
    
    col.innerHTML = `
        <div class="resume-card">
            <div class="resume-thumbnail">
                <i class="fas fa-file-alt"></i>
                <div class="resume-actions">
                    <button class="btn btn-sm btn-light" onclick="editResume(${resume.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-light" onclick="duplicateResume(${resume.id})">
                        <i class="fas fa-copy"></i> Duplicate
                    </button>
                    <button class="btn btn-sm btn-light" onclick="showDeleteModal(${resume.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                    <button class="btn btn-sm btn-light" onclick="downloadResume(${resume.id})">
                        <i class="fas fa-download"></i> Download
                    </button>
                </div>
            </div>
            <div class="resume-details">
                <h5>${resume.name}</h5>
                <div class="resume-meta">
                    <p class="mb-1">
                        <i class="fas fa-layer-group"></i> ${resume.template}
                    </p>
                    <p class="mb-1">
                        <i class="fas fa-calendar"></i> ${formatDate(resume.lastUpdated)}
                    </p>
                    <span class="badge ${resume.status === 'completed' ? 'bg-success' : 'bg-warning'}">
                        ${resume.status === 'completed' ? 'Completed' : 'Draft'}
                    </span>
                </div>
            </div>
        </div>
    `;
    
    return col;
}

// Show Rename Modal
function showRenameModal(id) {
    selectedResumeId = id;
    const resumes = storage.get('resumes') || [];
    const resume = resumes.find(r => r.id === id);
    
    if (resume) {
        document.getElementById('newResumeName').value = resume.name;
        const modal = new bootstrap.Modal(document.getElementById('renameModal'));
        modal.show();
    }
}

// Save Rename
function saveRename() {
    const newName = document.getElementById('newResumeName').value.trim();
    
    if (!newName) {
        showToast('Please enter a valid name', 'error');
        return;
    }
    
    const resumes = storage.get('resumes') || [];
    const resume = resumes.find(r => r.id === selectedResumeId);
    
    if (resume) {
        resume.name = newName;
        resume.lastUpdated = new Date().toISOString();
        storage.set('resumes', resumes);
        showToast('Resume renamed successfully!');
        loadResumes();
        bootstrap.Modal.getInstance(document.getElementById('renameModal')).hide();
    }
}

// Show Delete Modal
function showDeleteModal(id) {
    selectedResumeId = id;
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    modal.show();
}

// Confirm Delete
function confirmDelete() {
    let resumes = storage.get('resumes') || [];
    resumes = resumes.filter(r => r.id !== selectedResumeId);
    storage.set('resumes', resumes);
    showToast('Resume deleted successfully!');
    loadResumes();
    bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
}

// Initialize My Resumes Page
document.addEventListener('DOMContentLoaded', () => {
    loadResumes();
    
    // Search functionality
    const searchInput = document.getElementById('searchResumes');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            const statusFilter = document.getElementById('filterStatus').value;
            const templateFilter = document.getElementById('filterTemplate').value;
            loadResumes({
                search: e.target.value,
                status: statusFilter,
                template: templateFilter
            });
        }, 300));
    }
    
    // Status filter
    const statusFilter = document.getElementById('filterStatus');
    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            const searchTerm = document.getElementById('searchResumes').value;
            const templateFilter = document.getElementById('filterTemplate').value;
            loadResumes({
                search: searchTerm,
                status: e.target.value,
                template: templateFilter
            });
        });
    }
    
    // Template filter
    const templateFilter = document.getElementById('filterTemplate');
    if (templateFilter) {
        templateFilter.addEventListener('change', (e) => {
            const searchTerm = document.getElementById('searchResumes').value;
            const statusFilter = document.getElementById('filterStatus').value;
            loadResumes({
                search: searchTerm,
                status: statusFilter,
                template: e.target.value
            });
        });
    }
});