// Resume management functions

function getResumes(userId) {
    const resumes = JSON.parse(localStorage.getItem('resumes') || '[]');
    return userId ? resumes.filter(r => r.userId === userId) : resumes;
}

function getResumeById(id) {
    const resumes = JSON.parse(localStorage.getItem('resumes') || '[]');
    return resumes.find(r => r.id === id);
}

function saveResume(resume) {
    const resumes = JSON.parse(localStorage.getItem('resumes') || '[]');
    const index = resumes.findIndex(r => r.id === resume.id);
    
    if (index >= 0) {
        resumes[index] = {
            ...resume,
            updatedAt: new Date().toISOString()
        };
    } else {
        resumes.push({
            ...resume,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }
    
    localStorage.setItem('resumes', JSON.stringify(resumes));
    return resume;
}

function deleteResumeById(id) {
    let resumes = JSON.parse(localStorage.getItem('resumes') || '[]');
    resumes = resumes.filter(r => r.id !== id);
    localStorage.setItem('resumes', JSON.stringify(resumes));
}

function generateResumeId() {
    return 'resume_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function calculateProgress(resumeData) {
    let totalFields = 0;
    let filledFields = 0;
    
    // Personal Info (5 fields)
    totalFields += 5;
    if (resumeData.fullName) filledFields++;
    if (resumeData.email) filledFields++;
    if (resumeData.phone) filledFields++;
    if (resumeData.location) filledFields++;
    if (resumeData.summary) filledFields++;
    
    // Experience
    if (resumeData.experience && resumeData.experience.length > 0) {
        totalFields += 1;
        filledFields += 1;
    } else {
        totalFields += 1;
    }
    
    // Education
    if (resumeData.education && resumeData.education.length > 0) {
        totalFields += 1;
        filledFields += 1;
    } else {
        totalFields += 1;
    }
    
    // Skills
    if (resumeData.skills && resumeData.skills.length > 0) {
        totalFields += 1;
        filledFields += 1;
    } else {
        totalFields += 1;
    }
    
    return Math.round((filledFields / totalFields) * 100);
}

function calculateATSScore(resumeData) {
    let score = 0;
    
    // Has personal info
    if (resumeData.fullName && resumeData.email && resumeData.phone) {
        score += 20;
    }
    
    // Has professional summary
    if (resumeData.summary && resumeData.summary.length > 50) {
        score += 15;
    }
    
    // Has work experience
    if (resumeData.experience && resumeData.experience.length > 0) {
        score += 25;
        // Detailed descriptions
        if (resumeData.experience.some(e => e.description && e.description.length > 100)) {
            score += 10;
        }
    }
    
    // Has education
    if (resumeData.education && resumeData.education.length > 0) {
        score += 15;
    }
    
    // Has skills
    if (resumeData.skills && resumeData.skills.length >= 5) {
        score += 15;
    }
    
    return Math.min(score, 100);
}