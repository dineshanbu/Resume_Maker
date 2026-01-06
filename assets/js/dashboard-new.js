// Dashboard Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!requireAuth()) {
        window.location.href = 'login.html';
        return;
    }

    // Load user data
    loadUserData();
    loadRecentActivityCarousel();
    loadRecentResumes();
    loadOpportunities();
    initCircularProgress();
    
    // Add page fade-in animation
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});

function loadUserData() {
    const user = getCurrentUser();
    if (!user) return;

    // Set user name in multiple places
    document.getElementById('userName').textContent = user.name || user.email.split('@')[0];
    document.getElementById('navUserName').textContent = user.name || user.email.split('@')[0];
    
    // Set active plan
    const plan = user.plan || 'free';
    document.getElementById('activePlan').textContent = plan.charAt(0).toUpperCase() + plan.slice(1);
    document.getElementById('currentPlanName').textContent = plan === 'premium' ? 'Premium Plan' : 'Free Plan';
    
    // Load resumes count
    const resumes = JSON.parse(localStorage.getItem('resumes') || '[]');
    const userResumes = resumes.filter(r => r.userId === user.email);
    document.getElementById('totalResumes').textContent = userResumes.length;
    
    // Calculate profile completion
    let completion = 50;
    if (user.name) completion += 15;
    if (userResumes.length > 0) completion += 20;
    if (user.phone) completion += 15;
    document.getElementById('profileCompletion').textContent = Math.min(completion, 100) + '%';
}

function loadRecentActivityCarousel() {
    const user = getCurrentUser();
    if (!user) return;

    const resumes = JSON.parse(localStorage.getItem('resumes') || '[]');
    const userResumes = resumes.filter(r => r.userId === user.email).slice(0, 4);
    
    const container = document.getElementById('carouselTrack');
    
    let carouselHTML = '';
    
    // Add existing resumes
    userResumes.forEach(resume => {
        carouselHTML += `
            <div class="carousel-item-card" onclick="window.location.href='resume-builder.html?id=${resume.id}'">
                <div class="carousel-item-thumbnail">
                    <i class="bi bi-file-earmark-text"></i>
                </div>
            </div>
        `;
    });
    
    // Add "Create Resume" card
    carouselHTML += `
        <div class="carousel-item-card" onclick="window.location.href='resume-builder.html'">
            <div class="carousel-item-thumbnail carousel-item-create">
                <i class="bi bi-plus-circle"></i>
                <div class="carousel-item-create-text">Create Resume</div>
            </div>
        </div>
    `;
    
    // Add 3 more empty placeholder cards
    for (let i = 0; i < 3; i++) {
        carouselHTML += `
            <div class="carousel-item-card">
                <div class="carousel-item-thumbnail">
                    <i class="bi bi-file-earmark"></i>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = carouselHTML;
}

function loadRecentResumes() {
    const user = getCurrentUser();
    if (!user) return;

    const resumes = JSON.parse(localStorage.getItem('resumes') || '[]');
    const userResumes = resumes.filter(r => r.userId === user.email).slice(0, 3);
    
    const container = document.getElementById('recentResumesList');
    
    if (userResumes.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="empty-state py-4">
                    <i class="bi bi-file-earmark-text"></i>
                    <h6>No resumes yet</h6>
                    <p>Create your first professional resume now!</p>
                    <a href="resume-builder.html" class="btn btn-primary btn-sm mt-2">
                        <i class="bi bi-plus-circle me-2"></i>Create Resume
                    </a>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = userResumes.map(resume => `
        <div class="col-md-4">
            <div class="resume-card-compact" onclick="window.location.href='resume-builder.html?id=${resume.id}'">
                <div class="resume-thumbnail-small">
                    <i class="bi bi-file-earmark-text"></i>
                </div>
                <h6 class="fw-semibold">${resume.name}</h6>
                <div class="resume-meta mb-2">
                    <span class="badge bg-primary-subtle text-primary">${resume.template || 'Professional'}</span>
                    <span class="ms-2">${formatDate(resume.updatedAt)}</span>
                </div>
                <div class="resume-actions">
                    <a href="resume-preview.html?id=${resume.id}" class="btn btn-sm btn-outline-primary" onclick="event.stopPropagation()">
                        <i class="bi bi-eye"></i> View
                    </a>
                    <a href="resume-builder.html?id=${resume.id}" class="btn btn-sm btn-primary" onclick="event.stopPropagation()">
                        <i class="bi bi-pencil"></i> Edit
                    </a>
                </div>
            </div>
        </div>
    `).join('');
}

function loadRecentJobs() {
    const jobs = [
        {
            id: 1,
            title: 'Senior Software Engineer',
            company: 'Google',
            location: 'Bangalore',
            type: 'Full-time',
            salary: '₹25-35 LPA',
            posted: '2 days ago'
        },
        {
            id: 2,
            title: 'Product Designer',
            company: 'Microsoft',
            location: 'Hyderabad',
            type: 'Full-time',
            salary: '₹18-28 LPA',
            posted: '3 days ago'
        },
        {
            id: 3,
            title: 'Marketing Manager',
            company: 'Amazon',
            location: 'Mumbai',
            type: 'Full-time',
            salary: '₹15-22 LPA',
            posted: '5 days ago'
        }
    ];
    
    const container = document.getElementById('recentJobsList');
    
    container.innerHTML = jobs.map(job => `
        <div class="job-card-compact" onclick="window.location.href='jobs-new.html'">
            <div class="job-header">
                <div class="job-logo">
                    <i class="bi bi-building"></i>
                </div>
                <div class="flex-grow-1">
                    <h6 class="fw-semibold mb-1">${job.title}</h6>
                    <div class="company-name">${job.company}</div>
                </div>
            </div>
            <div class="job-meta">
                <span><i class="bi bi-geo-alt"></i>${job.location}</span>
                <span><i class="bi bi-briefcase"></i>${job.type}</span>
                <span><i class="bi bi-currency-rupee"></i>${job.salary}</span>
            </div>
            <div class="d-flex justify-content-between align-items-center">
                <small class="text-muted">${job.posted}</small>
                <button class="btn btn-sm btn-primary" onclick="event.stopPropagation()">Apply Now</button>
            </div>
        </div>
    `).join('');
}

function loadOpportunities() {
    const opportunities = [
        {
            id: 1,
            title: 'Product Designer',
            company: 'Google',
            location: 'Bangalore',
            experience: '3-5 Years',
            salary: '₹ 55.15-33 LPA',
            posted: '2 days ago'
        },
        {
            id: 2,
            title: 'Product Designer',
            company: 'Amazon',
            location: 'Maratham',
            experience: '2-4 Years',
            salary: '₹ 5555.33 LPA',
            posted: '3 days ago'
        },
        {
            id: 3,
            title: 'Product Designer',
            company: 'Armosoft',
            location: 'Mantipolam',
            experience: '3-5 Years',
            salary: '₹ 05.15-33 LPA',
            posted: '3 days ago'
        },
        {
            id: 4,
            title: 'Marketing M',
            company: 'Etosnerle',
            location: 'Masittilen',
            experience: '1-3 Years',
            salary: '₹ 5825',
            posted: '3 days ago'
        }
    ];
    
    const container = document.getElementById('opportunitiesList');
    
    container.innerHTML = opportunities.map(opp => `
        <div class="col-md-6">
            <div class="opportunity-card" onclick="window.location.href='jobs.html'">
                <div class="opportunity-header">
                    <div class="opportunity-logo">
                        <i class="bi bi-building"></i>
                    </div>
                    <div class="flex-grow-1">
                        <div class="opportunity-title">${opp.title}</div>
                        <div class="opportunity-company">${opp.company}</div>
                    </div>
                </div>
                <div class="opportunity-meta">
                    <span><i class="bi bi-geo-alt"></i>${opp.location}</span>
                    <span><i class="bi bi-clock"></i>${opp.experience}</span>
                    <span><i class="bi bi-currency-rupee"></i>${opp.salary}</span>
                </div>
                <div class="opportunity-footer">
                    <div class="opportunity-posted">${opp.posted}</div>
                    <button class="btn btn-sm btn-primary" onclick="event.stopPropagation()">Apply Now</button>
                </div>
            </div>
        </div>
    `).join('');
}

function initCircularProgress() {
    const circle = document.getElementById('progressCircle');
    const progressValue = 92; // 92% as shown in the image
    const circumference = 2 * Math.PI * 70;
    const offset = circumference - (progressValue / 100) * circumference;
    
    // Animate the circle
    setTimeout(() => {
        circle.style.strokeDashoffset = offset;
    }, 500);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}

