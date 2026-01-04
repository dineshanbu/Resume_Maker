// Jobs management

// Initialize dummy jobs data
function initializeJobs() {
    if (!localStorage.getItem('jobs')) {
        const dummyJobs = [
            {
                id: 'job_1',
                title: 'Senior Software Engineer',
                company: 'TechCorp Inc.',
                location: 'San Francisco, CA',
                type: 'Full-time',
                category: 'IT',
                remote: true,
                match: 95,
                salary: '$120k - $180k',
                description: 'We are looking for an experienced software engineer to join our team...'
            },
            {
                id: 'job_2',
                title: 'Product Manager',
                company: 'Innovation Labs',
                location: 'New York, NY',
                type: 'Full-time',
                category: 'Marketing',
                remote: false,
                match: 88,
                salary: '$100k - $150k',
                description: 'Lead product strategy and development for our flagship products...'
            },
            {
                id: 'job_3',
                title: 'UX Designer',
                company: 'Design Studio',
                location: 'Austin, TX',
                type: 'Full-time',
                category: 'Design',
                remote: true,
                match: 92,
                salary: '$80k - $120k',
                description: 'Create beautiful and intuitive user experiences for web and mobile...'
            },
            {
                id: 'job_4',
                title: 'Financial Analyst',
                company: 'Global Finance Corp',
                location: 'Boston, MA',
                type: 'Full-time',
                category: 'Finance',
                remote: false,
                match: 85,
                salary: '$70k - $100k',
                description: 'Analyze financial data and provide insights to drive business decisions...'
            },
            {
                id: 'job_5',
                title: 'Marketing Coordinator',
                company: 'Brand Masters',
                location: 'Los Angeles, CA',
                type: 'Full-time',
                category: 'Marketing',
                remote: true,
                match: 78,
                salary: '$50k - $70k',
                description: 'Support marketing campaigns and coordinate promotional activities...'
            },
            {
                id: 'job_6',
                title: 'Junior Developer',
                company: 'StartupXYZ',
                location: 'Remote',
                type: 'Full-time',
                category: 'Freshers',
                remote: true,
                match: 82,
                salary: '$60k - $80k',
                description: 'Join our dynamic team as a junior developer and grow your skills...'
            },
            {
                id: 'job_7',
                title: 'Data Scientist',
                company: 'AI Solutions',
                location: 'Seattle, WA',
                type: 'Full-time',
                category: 'IT',
                remote: true,
                match: 90,
                salary: '$130k - $170k',
                description: 'Work on cutting-edge AI and machine learning projects...'
            },
            {
                id: 'job_8',
                title: 'Graphic Designer',
                company: 'Creative Agency',
                location: 'Chicago, IL',
                type: 'Contract',
                category: 'Design',
                remote: false,
                match: 75,
                salary: '$65k - $85k',
                description: 'Create stunning visual content for various marketing materials...'
            }
        ];
        localStorage.setItem('jobs', JSON.stringify(dummyJobs));
    }
}

initializeJobs();

let currentCategory = 'all';

function loadJobs() {
    const user = getCurrentUser();
    const jobs = JSON.parse(localStorage.getItem('jobs') || '[]');
    
    // Filter by category
    let filteredJobs = currentCategory === 'all' 
        ? jobs 
        : currentCategory === 'Remote'
            ? jobs.filter(j => j.remote)
            : jobs.filter(j => j.category === currentCategory);
    
    // Free users see only top 5 matches
    if (user.plan === 'free') {
        filteredJobs = filteredJobs.sort((a, b) => b.match - a.match).slice(0, 5);
    }
    
    const jobsList = document.getElementById('jobsList');
    
    if (filteredJobs.length === 0) {
        jobsList.innerHTML = `
            <div class="col-12">
                <div class="empty-state">
                    <i class="bi bi-briefcase"></i>
                    <h4>No jobs found</h4>
                    <p>Try selecting a different category</p>
                </div>
            </div>
        `;
        return;
    }
    
    jobsList.innerHTML = filteredJobs.map(job => `
        <div class="col-12">
            <div class="job-card position-relative">
                <div class="match-badge">${job.match}% Match</div>
                <div class="d-flex gap-3">
                    <div class="company-logo flex-shrink-0">
                        <i class="bi bi-building text-primary fs-3"></i>
                    </div>
                    <div class="flex-fill">
                        <h5 class="fw-bold mb-2">${job.title}</h5>
                        <div class="text-muted mb-2">
                            <i class="bi bi-building me-2"></i>${job.company}
                        </div>
                        <div class="d-flex flex-wrap gap-3 mb-3">
                            <small class="text-muted">
                                <i class="bi bi-geo-alt me-1"></i>${job.location}
                            </small>
                            <small class="text-muted">
                                <i class="bi bi-clock me-1"></i>${job.type}
                            </small>
                            <small class="text-muted">
                                <i class="bi bi-currency-dollar me-1"></i>${job.salary}
                            </small>
                            ${job.remote ? '<span class="badge bg-success-subtle text-success">Remote</span>' : ''}
                        </div>
                        <p class="text-muted mb-3">${job.description}</p>
                        <div class="d-flex gap-2">
                            <button class="btn btn-primary" onclick="applyJob('${job.id}')">
                                <i class="bi bi-send me-2"></i>Apply Now
                            </button>
                            <button class="btn btn-outline-primary" onclick="saveJob('${job.id}')">
                                <i class="bi bi-bookmark"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function filterJobs(category) {
    currentCategory = category;
    
    // Update active button
    document.querySelectorAll('[data-category]').forEach(btn => {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-outline-primary');
    });
    document.querySelector(`[data-category="${category}"]`).classList.remove('btn-outline-primary');
    document.querySelector(`[data-category="${category}"]`).classList.add('btn-primary');
    
    loadJobs();
}

function applyJob(jobId) {
    const jobs = JSON.parse(localStorage.getItem('jobs') || '[]');
    const job = jobs.find(j => j.id === jobId);
    
    if (job) {
        alert(`Application submitted for ${job.title} at ${job.company}!\n\n(This is a mock application - in a real system, this would redirect to the company's application page or submit your resume.)`);
    }
}

function saveJob(jobId) {
    alert('Job saved! (Mock feature - in a real system, this would save the job to your saved jobs list.)');
}

loadJobs();