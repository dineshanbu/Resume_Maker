// Admin panel functionality

// Require admin access
if (!requireAdmin()) {
    throw new Error('Unauthorized');
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('d-none');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.remove('d-none');
    
    // Update active menu
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[onclick="showSection('${sectionId}')"]`).classList.add('active');
    
    // Load data for section
    switch(sectionId) {
        case 'users':
            loadUsers();
            break;
        case 'resumes':
            loadResumes();
            break;
        case 'jobs':
            loadJobs();
            break;
    }
}

// Load dashboard stats
function loadDashboard() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const resumes = JSON.parse(localStorage.getItem('resumes') || '[]');
    const jobs = JSON.parse(localStorage.getItem('jobs') || '[]');
    
    // Total counts
    document.getElementById('totalUsers').textContent = users.length;
    document.getElementById('totalResumes').textContent = resumes.length;
    document.getElementById('totalJobs').textContent = jobs.length;
    
    // Premium users
    const premiumUsers = users.filter(u => u.plan === 'premium').length;
    document.getElementById('premiumUsers').textContent = premiumUsers;
    
    // User distribution
    const freeUsers = users.length - premiumUsers;
    const freePercent = users.length > 0 ? Math.round((freeUsers / users.length) * 100) : 0;
    const premiumPercent = users.length > 0 ? Math.round((premiumUsers / users.length) * 100) : 0;
    
    document.getElementById('freeUsersPercent').textContent = freePercent + '%';
    document.getElementById('premiumUsersPercent').textContent = premiumPercent + '%';
    
    // Resume stats
    const avgResumes = users.length > 0 ? (resumes.length / users.length).toFixed(1) : 0;
    document.getElementById('avgResumesPerUser').textContent = avgResumes;
    
    const avgAts = resumes.length > 0 
        ? Math.round(resumes.reduce((sum, r) => sum + (r.atsScore || 0), 0) / resumes.length)
        : 0;
    document.getElementById('avgAtsScore').textContent = avgAts;
}

// Load users table
function loadUsers() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const resumes = JSON.parse(localStorage.getItem('resumes') || '[]');
    
    const tbody = document.querySelector('#usersTable tbody');
    tbody.innerHTML = users.map(user => {
        const userResumes = resumes.filter(r => r.userId === user.email);
        const joinedDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A';
        
        return `
            <tr>
                <td class="fw-semibold">${user.name}</td>
                <td>${user.email}</td>
                <td>
                    <span class="badge ${user.plan === 'premium' ? 'bg-warning' : 'bg-secondary'}">
                        ${user.plan === 'premium' ? 'Premium' : 'Free'}
                    </span>
                </td>
                <td>${userResumes.length}</td>
                <td>${joinedDate}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="viewUser('${user.email}')">
                        <i class="bi bi-eye"></i>
                    </button>
                    ${user.role !== 'admin' ? `
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteUser('${user.email}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

// Load resumes table
function loadResumes() {
    const resumes = JSON.parse(localStorage.getItem('resumes') || '[]');
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    const tbody = document.querySelector('#resumesTable tbody');
    tbody.innerHTML = resumes.map(resume => {
        const user = users.find(u => u.email === resume.userId);
        const userName = user ? user.name : 'Unknown';
        const updatedDate = new Date(resume.updatedAt).toLocaleDateString();
        
        return `
            <tr>
                <td class="fw-semibold">${resume.name}</td>
                <td>${userName}</td>
                <td>${resume.template}</td>
                <td>
                    <div class="progress" style="height: 20px;">
                        <div class="progress-bar ${resume.progress === 100 ? 'bg-success' : 'bg-warning'}" 
                             style="width: ${resume.progress}%">
                            ${resume.progress}%
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge ${resume.atsScore >= 80 ? 'bg-success' : resume.atsScore >= 60 ? 'bg-warning' : 'bg-danger'}">
                        ${resume.atsScore}
                    </span>
                </td>
                <td>${updatedDate}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="viewResume('${resume.id}')">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteResume('${resume.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Load jobs table
function loadJobs() {
    const jobs = JSON.parse(localStorage.getItem('jobs') || '[]');
    
    const tbody = document.querySelector('#jobsTable tbody');
    tbody.innerHTML = jobs.map(job => `
        <tr>
            <td class="fw-semibold">${job.title}</td>
            <td>${job.company}</td>
            <td>${job.location}</td>
            <td>
                <span class="badge bg-primary">${job.category}</span>
            </td>
            <td>
                <span class="badge bg-success">Active</span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editJob('${job.id}')">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteJob('${job.id}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// User actions
function viewUser(email) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email);
    const resumes = JSON.parse(localStorage.getItem('resumes') || '[]');
    const userResumes = resumes.filter(r => r.userId === email);
    
    if (user) {
        alert(`User Details:\n\nName: ${user.name}\nEmail: ${user.email}\nPlan: ${user.plan}\nResumes: ${userResumes.length}\nJoined: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}`);
    }
}

function deleteUser(email) {
    if (confirm(`Are you sure you want to delete user ${email}? This will also delete all their resumes.`)) {
        // Delete user
        let users = JSON.parse(localStorage.getItem('users') || '[]');
        users = users.filter(u => u.email !== email);
        localStorage.setItem('users', JSON.stringify(users));
        
        // Delete user's resumes
        let resumes = JSON.parse(localStorage.getItem('resumes') || '[]');
        resumes = resumes.filter(r => r.userId !== email);
        localStorage.setItem('resumes', JSON.stringify(resumes));
        
        loadDashboard();
        loadUsers();
        alert('User deleted successfully');
    }
}

// Resume actions
function viewResume(resumeId) {
    window.open(`resume-preview.html?id=${resumeId}`, '_blank');
}

function deleteResume(resumeId) {
    if (confirm('Are you sure you want to delete this resume?')) {
        let resumes = JSON.parse(localStorage.getItem('resumes') || '[]');
        resumes = resumes.filter(r => r.id !== resumeId);
        localStorage.setItem('resumes', JSON.stringify(resumes));
        
        loadDashboard();
        loadResumes();
        alert('Resume deleted successfully');
    }
}

// Job actions
function addJob() {
    const title = prompt('Job Title:');
    if (!title) return;
    
    const company = prompt('Company:');
    if (!company) return;
    
    const location = prompt('Location:');
    if (!location) return;
    
    const category = prompt('Category (IT/Marketing/Finance/Design/Freshers):');
    if (!category) return;
    
    const salary = prompt('Salary Range:');
    if (!salary) return;
    
    const description = prompt('Job Description:');
    if (!description) return;
    
    const jobs = JSON.parse(localStorage.getItem('jobs') || '[]');
    const newJob = {
        id: 'job_' + Date.now(),
        title,
        company,
        location,
        category,
        salary,
        description,
        type: 'Full-time',
        remote: location.toLowerCase().includes('remote'),
        match: Math.floor(Math.random() * 20) + 70 // Random match 70-90
    };
    
    jobs.push(newJob);
    localStorage.setItem('jobs', JSON.stringify(jobs));
    
    loadDashboard();
    loadJobs();
    alert('Job added successfully');
}

function editJob(jobId) {
    const jobs = JSON.parse(localStorage.getItem('jobs') || '[]');
    const job = jobs.find(j => j.id === jobId);
    
    if (job) {
        alert(`Edit Job: ${job.title}\n\n(Mock feature - in a real system, this would open an edit form)`);
    }
}

function deleteJob(jobId) {
    if (confirm('Are you sure you want to delete this job?')) {
        let jobs = JSON.parse(localStorage.getItem('jobs') || '[]');
        jobs = jobs.filter(j => j.id !== jobId);
        localStorage.setItem('jobs', JSON.stringify(jobs));
        
        loadDashboard();
        loadJobs();
        alert('Job deleted successfully');
    }
}

// Template management
function saveTemplates() {
    const templates = {
        professional: document.getElementById('tplProfessional').checked,
        modern: document.getElementById('tplModern').checked,
        creative: document.getElementById('tplCreative').checked,
        executive: document.getElementById('tplExecutive').checked
    };
    
    localStorage.setItem('enabledTemplates', JSON.stringify(templates));
    alert('Template settings saved successfully!');
}

// Initialize dashboard
loadDashboard();
