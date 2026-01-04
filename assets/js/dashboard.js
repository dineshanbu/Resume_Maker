// Dashboard functionality

// Protect page
if (!requireAuth()) {
    throw new Error('Unauthorized');
}

// Toggle sidebar for mobile
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

// Load dashboard data
function loadDashboard() {
    const user = getCurrentUser();
    
    // Update user info
    document.getElementById('userName').textContent = user.name;
    const planBadge = document.getElementById('userPlan');
    planBadge.textContent = user.plan === 'premium' ? 'Premium Plan' : 'Free Plan';
    planBadge.className = user.plan === 'premium' ? 'badge bg-warning' : 'badge bg-primary';
    
    // Get resumes
    const resumes = JSON.parse(localStorage.getItem('resumes') || '[]');
    const userResumes = resumes.filter(r => r.userId === user.email);
    
    // Update stats
    document.getElementById('totalResumes').textContent = userResumes.length;
    
    // Calculate completion rate
    if (userResumes.length > 0) {
        const completedResumes = userResumes.filter(r => r.progress === 100).length;
        const completionRate = Math.round((completedResumes / userResumes.length) * 100);
        document.getElementById('completionRate').textContent = completionRate + '%';
    } else {
        document.getElementById('completionRate').textContent = '0%';
    }
    
    // Average ATS score
    if (userResumes.length > 0) {
        const avgScore = Math.round(
            userResumes.reduce((sum, r) => sum + (r.atsScore || 0), 0) / userResumes.length
        );
        document.getElementById('atsScore').textContent = avgScore;
    } else {
        document.getElementById('atsScore').textContent = '0';
    }
    
    // Job matches (dummy count)
    const jobs = JSON.parse(localStorage.getItem('jobs') || '[]');
    const jobMatches = jobs.filter(j => j.match > 70).length;
    document.getElementById('jobMatches').textContent = jobMatches;
    
    // Load recent resumes
    loadRecentResumes(userResumes);
    
    // Update plan info
    updatePlanInfo(user);
}

function loadRecentResumes(resumes) {
    const container = document.getElementById('recentResumes');
    
    if (resumes.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="empty-state py-5">
                    <i class="bi bi-file-earmark-text"></i>
                    <h5>No resumes yet</h5>
                    <p>Create your first resume to get started!</p>
                    <a href="resume-builder.html" class="btn btn-primary">
                        <i class="bi bi-plus-circle me-2"></i>Create Resume
                    </a>
                </div>
            </div>
        `;
        return;
    }
    
    // Show only first 3 resumes
    const recentResumes = resumes.slice(-3).reverse();
    
    container.innerHTML = recentResumes.map(resume => `
        <div class="col-md-4">
            <div class="resume-card">
                <div class="resume-preview">
                    <div class="resume-preview-content">
                        <i class="bi bi-file-earmark-text"></i>
                    </div>
                </div>
                <h6 class="mb-2 fw-semibold">${resume.name}</h6>
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <small class="text-muted">${resume.template}</small>
                    <span class="badge bg-success-subtle text-success">${resume.progress}%</span>
                </div>
                <small class="text-muted">Updated ${formatDate(resume.updatedAt)}</small>
                <div class="mt-3 d-flex gap-2">
                    <a href="resume-preview.html?id=${resume.id}" class="btn btn-sm btn-outline-primary flex-fill">
                        <i class="bi bi-eye"></i>
                    </a>
                    <a href="resume-builder.html?id=${resume.id}" class="btn btn-sm btn-primary flex-fill">
                        <i class="bi bi-pencil"></i>
                    </a>
                </div>
            </div>
        </div>
    `).join('');
}

function updatePlanInfo(user) {
    const planInfo = document.getElementById('planInfo');
    
    if (user.plan === 'premium') {
        planInfo.innerHTML = `
            <div class="display-6 fw-bold mb-2 text-warning">
                <i class="bi bi-star-fill"></i> Premium
            </div>
            <p class="text-muted mb-3">Unlimited Resumes • All Features</p>
            <button class="btn btn-outline-primary w-100" disabled>
                Current Plan
            </button>
        `;
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
}

// Initialize dashboard
loadDashboard();

// Initialize dummy data if needed
function initializeDummyResumes() {
    if (!localStorage.getItem('resumes')) {
        const dummyResumes = [
            {
                id: 'resume_1',
                userId: 'user@demo.com',
                name: 'Software Engineer Resume',
                template: 'Professional',
                progress: 100,
                atsScore: 92,
                createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                data: {}
            },
            {
                id: 'resume_2',
                userId: 'user@demo.com',
                name: 'Product Manager Resume',
                template: 'Modern',
                progress: 85,
                atsScore: 88,
                createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                data: {}
            }
        ];
        localStorage.setItem('resumes', JSON.stringify(dummyResumes));
    }
}

initializeDummyResumes();