// ========================================
// Create Resume Page Script
// ========================================

let currentSection = 1;
const totalSections = 5;
let formData = {};

// Change Section
function changeSection(direction) {
    const currentSectionElement = document.getElementById(`section-${currentSection}`);
    currentSectionElement.classList.remove('active');
    
    currentSection += direction;
    
    if (currentSection < 1) currentSection = 1;
    if (currentSection > totalSections) currentSection = totalSections;
    
    const newSectionElement = document.getElementById(`section-${currentSection}`);
    newSectionElement.classList.add('active');
    
    updateProgress();
    updateNavigationButtons();
    updateSteps();
}

// Update Progress Bar
function updateProgress() {
    const progress = (currentSection / totalSections) * 100;
    document.getElementById('formProgress').style.width = progress + '%';
}

// Update Navigation Buttons
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (currentSection === 1) {
        prevBtn.style.display = 'none';
    } else {
        prevBtn.style.display = 'inline-block';
    }
    
    if (currentSection === totalSections) {
        nextBtn.innerHTML = '<i class="fas fa-check"></i> Complete';
    } else {
        nextBtn.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
    }
}

// Update Progress Steps
function updateSteps() {
    document.querySelectorAll('.progress-step').forEach((step, index) => {
        if (index + 1 <= currentSection) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
}

// Add Experience Block
function addExperience() {
    const container = document.getElementById('experienceContainer');
    const index = container.children.length;
    
    const block = document.createElement('div');
    block.className = 'experience-block';
    block.dataset.index = index;
    block.innerHTML = `
        <button type="button" class="btn-remove-block" onclick="removeBlock(this)">
            <i class="fas fa-times"></i>
        </button>
        <div class="mb-3">
            <label class="form-label">Company Name *</label>
            <input type="text" class="form-control" name="company[]" required>
        </div>
        <div class="mb-3">
            <label class="form-label">Job Role *</label>
            <input type="text" class="form-control" name="role[]" required>
        </div>
        <div class="row">
            <div class="col-md-6 mb-3">
                <label class="form-label">Start Date</label>
                <input type="month" class="form-control" name="expStart[]">
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label">End Date</label>
                <input type="month" class="form-control" name="expEnd[]">
            </div>
        </div>
        <div class="mb-3 form-check">
            <input type="checkbox" class="form-check-input" name="currentWork[]">
            <label class="form-check-label">Currently Working Here</label>
        </div>
        <div class="mb-3">
            <label class="form-label">Responsibilities</label>
            <textarea class="form-control" name="responsibilities[]" rows="4"></textarea>
        </div>
    `;
    
    container.appendChild(block);
    showToast('Experience block added!');
}

// Add Project Block
function addProject() {
    const container = document.getElementById('projectsContainer');
    const index = container.children.length;
    
    const block = document.createElement('div');
    block.className = 'project-block';
    block.dataset.index = index;
    block.innerHTML = `
        <button type="button" class="btn-remove-block" onclick="removeBlock(this)">
            <i class="fas fa-times"></i>
        </button>
        <div class="mb-3">
            <label class="form-label">Project Name</label>
            <input type="text" class="form-control" name="projectName[]">
        </div>
        <div class="mb-3">
            <label class="form-label">Description</label>
            <textarea class="form-control" name="projectDesc[]" rows="3"></textarea>
        </div>
        <div class="row">
            <div class="col-md-6 mb-3">
                <label class="form-label">Tech Stack</label>
                <input type="text" class="form-control" name="techStack[]" placeholder="React, Node.js, MongoDB">
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label">Project URL</label>
                <input type="url" class="form-control" name="projectUrl[]">
            </div>
        </div>
    `;
    
    container.appendChild(block);
    showToast('Project block added!');
}

// Add Education Block
function addEducation() {
    const container = document.getElementById('educationContainer');
    const index = container.children.length;
    
    const block = document.createElement('div');
    block.className = 'education-block';
    block.dataset.index = index;
    block.innerHTML = `
        <button type="button" class="btn-remove-block" onclick="removeBlock(this)">
            <i class="fas fa-times"></i>
        </button>
        <div class="mb-3">
            <label class="form-label">Institution</label>
            <input type="text" class="form-control" name="institution[]">
        </div>
        <div class="mb-3">
            <label class="form-label">Degree</label>
            <input type="text" class="form-control" name="degree[]">
        </div>
        <div class="row">
            <div class="col-md-6 mb-3">
                <label class="form-label">Field of Study</label>
                <input type="text" class="form-control" name="field[]">
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label">Year</label>
                <input type="text" class="form-control" name="eduYear[]" placeholder="2020 - 2024">
            </div>
        </div>
    `;
    
    container.appendChild(block);
    showToast('Education block added!');
}

// Remove Block
function removeBlock(button) {
    button.parentElement.remove();
    showToast('Block removed!');
}

// AI Improve Summary
function improveSummary() {
    const summaryField = document.getElementById('summary');
    const currentText = summaryField.value;
    
    if (!currentText) {
        showToast('Please write a summary first', 'error');
        return;
    }
    
    showToast('AI is improving your summary...');
    
    // Simulate AI processing
    setTimeout(() => {
        const improved = currentText + ' Enhanced with AI-powered language optimization for better impact and clarity.';
        summaryField.value = improved;
        updateCharCount();
        showToast('Summary improved successfully!');
    }, 2000);
}

// Update Character Count
function updateCharCount() {
    const summary = document.getElementById('summary');
    const count = document.getElementById('summaryCount');
    if (summary && count) {
        count.textContent = summary.value.length;
    }
}

// Save as Draft
function saveAsDraft() {
    showToast('Saving draft...');
    setTimeout(() => {
        showToast('Draft saved successfully!');
    }, 1000);
}

// Download Resume (Mock)
function downloadResume() {
    showToast('Generating PDF...');
    setTimeout(() => {
        showToast('Resume downloaded successfully!');
    }, 1500);
}

// Zoom Functions
let zoomLevel = 100;

function zoomIn() {
    zoomLevel = Math.min(zoomLevel + 10, 150);
    document.getElementById('resumePreview').style.transform = `scale(${zoomLevel / 100})`;
}

function zoomOut() {
    zoomLevel = Math.max(zoomLevel - 10, 50);
    document.getElementById('resumePreview').style.transform = `scale(${zoomLevel / 100})`;
}

// Update Live Preview
function updatePreview() {
    const preview = document.getElementById('resumePreview');
    const fullName = document.getElementById('fullName')?.value || '';
    const jobTitle = document.getElementById('jobTitle')?.value || '';
    const email = document.getElementById('email')?.value || '';
    const phone = document.getElementById('phone')?.value || '';
    const summary = document.getElementById('summary')?.value || '';
    
    if (!fullName && !jobTitle && !email) {
        return; // Keep placeholder
    }
    
    preview.innerHTML = `
        <div style="padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 2px solid #1D88ED;">
                <h2 style="margin: 0 0 0.5rem 0; color: #0F172A; font-size: 2rem;">${fullName || 'Your Name'}</h2>
                <p style="margin: 0; color: #1D88ED; font-size: 1.25rem; font-weight: 600;">${jobTitle || 'Job Title'}</p>
                <div style="margin-top: 1rem; color: #64748B; font-size: 0.9rem;">
                    ${email ? `<span><i class="fas fa-envelope"></i> ${email}</span>` : ''}
                    ${phone ? `<span style="margin-left: 1rem;"><i class="fas fa-phone"></i> ${phone}</span>` : ''}
                </div>
            </div>
            ${summary ? `
                <div style="margin-bottom: 2rem;">
                    <h3 style="color: #1D88ED; margin-bottom: 1rem; font-size: 1.25rem;">Professional Summary</h3>
                    <p style="color: #0F172A; line-height: 1.6;">${summary}</p>
                </div>
            ` : ''}
            <div>
                <h3 style="color: #1D88ED; margin-bottom: 1rem; font-size: 1.25rem;">Experience</h3>
                <p style="color: #64748B; font-style: italic;">Add your work experience in the form...</p>
            </div>
        </div>
    `;
}

// Initialize Create Resume Page
document.addEventListener('DOMContentLoaded', () => {
    updateProgress();
    updateNavigationButtons();
    updateSteps();
    
    // Character count for summary
    const summary = document.getElementById('summary');
    if (summary) {
        summary.addEventListener('input', updateCharCount);
    }
    
    // Live preview updates
    ['fullName', 'jobTitle', 'email', 'phone', 'summary'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', debounce(updatePreview, 500));
        }
    });
});