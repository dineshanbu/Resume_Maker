// ========================================
// AI Builder Page Script
// ========================================

const aiInputCard = document.getElementById('aiInputCard');
const aiProcessing = document.getElementById('aiProcessing');
const aiResult = document.getElementById('aiResult');

// Generate Resume with AI
function generateResume() {
    // Validate inputs
    const jobTitle = document.getElementById('aiJobTitle').value;
    const experienceLevel = document.getElementById('aiExperienceLevel').value;
    const industry = document.getElementById('aiIndustry').value;
    const skills = document.getElementById('aiSkills').value;
    const years = document.getElementById('aiYears').value;
    
    if (!jobTitle || !experienceLevel || !industry || !skills || !years) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    // Hide input, show processing
    aiInputCard.style.display = 'none';
    aiProcessing.style.display = 'block';
    
    // Simulate AI processing
    const steps = [
        'Analyzing your information...',
        'Generating professional summary...',
        'Creating experience sections...',
        'Optimizing for ATS...',
        'Finalizing your resume...'
    ];
    
    let currentStep = 0;
    const progressBar = document.getElementById('aiProgressBar');
    const statusText = document.getElementById('aiStatusText');
    
    const interval = setInterval(() => {
        currentStep++;
        const progress = (currentStep / steps.length) * 100;
        progressBar.style.width = progress + '%';
        
        if (currentStep < steps.length) {
            statusText.textContent = steps[currentStep];
        } else {
            clearInterval(interval);
            
            // Show result
            setTimeout(() => {
                showAIResult({
                    jobTitle,
                    experienceLevel,
                    industry,
                    skills,
                    years
                });
            }, 500);
        }
    }, 1000);
}

// Show AI Generated Result
function showAIResult(data) {
    aiProcessing.style.display = 'none';
    aiResult.style.display = 'block';
    
    const output = document.getElementById('aiOutput');
    output.innerHTML = `
        <div class="ai-generated-resume">
            <h4 class="mb-4">AI-Generated Resume Content</h4>
            
            <div class="mb-4">
                <h5 class="text-primary">Professional Summary</h5>
                <p>Experienced ${data.jobTitle} with ${data.years} years of expertise in ${data.industry}. 
                Proven track record of delivering high-impact solutions using ${data.skills.split(',')[0]} and related technologies. 
                Skilled in driving innovation, leading cross-functional teams, and implementing best practices to achieve organizational goals.</p>
            </div>
            
            <div class="mb-4">
                <h5 class="text-primary">Key Skills</h5>
                <div class="d-flex flex-wrap gap-2">
                    ${data.skills.split(',').map(skill => 
                        `<span class="badge bg-primary">${skill.trim()}</span>`
                    ).join('')}
                </div>
            </div>
            
            <div class="mb-4">
                <h5 class="text-primary">Experience Highlights</h5>
                <ul>
                    <li>Led development of innovative solutions that improved efficiency by 40%</li>
                    <li>Collaborated with cross-functional teams to deliver projects on time and within budget</li>
                    <li>Mentored junior team members and contributed to knowledge sharing initiatives</li>
                    <li>Implemented best practices and modern development methodologies</li>
                </ul>
            </div>
            
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i>
                <strong>Note:</strong> This is AI-generated content. You can edit and customize it according to your actual experience.
            </div>
        </div>
    `;
    
    showToast('Resume generated successfully!');
}

// Accept and Edit
function acceptAndEdit() {
    showToast('Redirecting to editor...');
    setTimeout(() => {
        window.location.href = 'create-resume.html?from=ai';
    }, 1000);
}

// Regenerate Content
function regenerateContent() {
    if (confirm('Are you sure you want to regenerate? Current content will be lost.')) {
        aiResult.style.display = 'none';
        aiProcessing.style.display = 'block';
        
        setTimeout(() => {
            const progressBar = document.getElementById('aiProgressBar');
            progressBar.style.width = '0%';
            
            // Re-run generation
            setTimeout(() => {
                showAIResult({
                    jobTitle: document.getElementById('aiJobTitle').value,
                    experienceLevel: document.getElementById('aiExperienceLevel').value,
                    industry: document.getElementById('aiIndustry').value,
                    skills: document.getElementById('aiSkills').value,
                    years: document.getElementById('aiYears').value
                });
            }, 2000);
        }, 500);
    }
}

// Reset AI Builder
function resetAI() {
    aiResult.style.display = 'none';
    aiProcessing.style.display = 'none';
    aiInputCard.style.display = 'block';
    document.getElementById('aiForm').reset();
}

// Show Tool Modal
let currentTool = null;

function showToolModal(toolType) {
    currentTool = toolType;
    const modal = new bootstrap.Modal(document.getElementById('aiToolModal'));
    const title = document.getElementById('toolModalTitle');
    const input = document.getElementById('toolInput');
    const output = document.getElementById('toolOutput');
    
    output.style.display = 'none';
    input.value = '';
    
    const titles = {
        summary: 'AI Summary Improvement',
        experience: 'AI Experience Rewriter',
        skills: 'AI Skills Suggestions',
        ats: 'ATS Optimization'
    };
    
    title.textContent = titles[toolType];
    modal.show();
}

// Process with AI Tool
function processWithAI() {
    const input = document.getElementById('toolInput').value;
    
    if (!input.trim()) {
        showToast('Please enter some text', 'error');
        return;
    }
    
    showToast('Processing with AI...');
    
    // Simulate AI processing
    setTimeout(() => {
        const output = document.getElementById('toolOutput');
        const outputText = document.getElementById('toolOutputText');
        
        let result = '';
        
        switch (currentTool) {
            case 'summary':
                result = 'Enhanced professional summary: ' + input + ' with improved clarity, impact, and ATS-friendly keywords.';
                break;
            case 'experience':
                result = 'Rewritten experience: ' + input + ' using action verbs and quantifiable achievements.';
                break;
            case 'skills':
                result = 'Suggested skills: JavaScript, React, Node.js, TypeScript, Python, AWS, Docker, Kubernetes, CI/CD, Agile';
                break;
            case 'ats':
                result = 'ATS Optimization: Your resume is 85% ATS-friendly. Suggestions: Add more industry keywords, use standard section headings, avoid complex formatting.';
                break;
        }
        
        outputText.textContent = result;
        output.style.display = 'block';
        showToast('AI processing complete!');
    }, 2000);
}