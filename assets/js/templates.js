// ========================================
// Templates Page Script
// ========================================

let currentCategory = 'all';
let selectedTemplate = null;

// Load Templates
function loadTemplates(category = 'all') {
    const templates = storage.get('templates') || [];
    const templatesGrid = document.getElementById('templatesGrid');
    
    if (!templatesGrid) return;
    
    currentCategory = category;
    
    // Filter templates by category
    const filteredTemplates = category === 'all' 
        ? templates 
        : templates.filter(t => t.category === category);
    
    // Render template cards
    templatesGrid.innerHTML = '';
    filteredTemplates.forEach(template => {
        const card = createTemplateCard(template);
        templatesGrid.appendChild(card);
    });
}

// Create Template Card
function createTemplateCard(template) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';
    
    col.innerHTML = `
        <div class="template-card" onclick="previewTemplate(${template.id})">
            <div class="template-preview">
                <div style="padding: 2rem; text-align: center; color: #64748B;">
                    <i class="fas fa-file-alt" style="font-size: 5rem; margin-bottom: 1rem;"></i>
                    <p>Click to preview</p>
                </div>
                <div class="template-overlay">
                    <button class="btn btn-light btn-lg">
                        <i class="fas fa-eye"></i> Preview
                    </button>
                </div>
            </div>
            <div class="template-info">
                <h5>${template.name}</h5>
                <p>${template.description}</p>
                <span class="badge bg-primary">${template.category}</span>
            </div>
        </div>
    `;
    
    return col;
}

// Preview Template
function previewTemplate(id) {
    const templates = storage.get('templates') || [];
    const template = templates.find(t => t.id === id);
    
    if (template) {
        selectedTemplate = template;
        const modal = new bootstrap.Modal(document.getElementById('templatePreviewModal'));
        document.getElementById('templateName').textContent = template.name;
        
        // Generate preview content
        const previewContent = document.getElementById('templatePreviewContent');
        previewContent.innerHTML = `
            <div style="background: white; padding: 3rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 3px solid #1D88ED;">
                    <h2 style="margin: 0 0 0.5rem 0; color: #0F172A;">John Doe</h2>
                    <p style="margin: 0; color: #1D88ED; font-size: 1.25rem; font-weight: 600;">Senior Software Engineer</p>
                    <p style="margin-top: 0.5rem; color: #64748B;">john.doe@email.com | +1 234 567 8900 | San Francisco, CA</p>
                </div>
                
                <div style="margin-bottom: 2rem;">
                    <h3 style="color: #1D88ED; margin-bottom: 1rem;">Professional Summary</h3>
                    <p style="color: #0F172A; line-height: 1.6;">
                        Experienced software engineer with 8+ years of expertise in full-stack development. 
                        Proven track record of delivering scalable solutions and leading technical teams.
                    </p>
                </div>
                
                <div style="margin-bottom: 2rem;">
                    <h3 style="color: #1D88ED; margin-bottom: 1rem;">Experience</h3>
                    <div style="margin-bottom: 1.5rem;">
                        <h4 style="margin: 0; color: #0F172A;">Senior Software Engineer</h4>
                        <p style="margin: 0.25rem 0; color: #64748B;">Tech Company | 2020 - Present</p>
                        <ul style="color: #0F172A; line-height: 1.6;">
                            <li>Led development of microservices architecture</li>
                            <li>Mentored team of 5 junior developers</li>
                            <li>Improved system performance by 40%</li>
                        </ul>
                    </div>
                </div>
                
                <div style="margin-bottom: 2rem;">
                    <h3 style="color: #1D88ED; margin-bottom: 1rem;">Skills</h3>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                        <span style="background: #1D88ED; color: white; padding: 0.5rem 1rem; border-radius: 6px;">JavaScript</span>
                        <span style="background: #1D88ED; color: white; padding: 0.5rem 1rem; border-radius: 6px;">React</span>
                        <span style="background: #1D88ED; color: white; padding: 0.5rem 1rem; border-radius: 6px;">Node.js</span>
                        <span style="background: #1D88ED; color: white; padding: 0.5rem 1rem; border-radius: 6px;">Python</span>
                    </div>
                </div>
            </div>
        `;
        
        modal.show();
    }
}

// Apply Template
function applyTemplate() {
    if (selectedTemplate) {
        showToast('Template applied successfully!');
        setTimeout(() => {
            window.location.href = `create-resume.html?template=${selectedTemplate.id}`;
        }, 1000);
    }
}

// Initialize Templates Page
document.addEventListener('DOMContentLoaded', () => {
    loadTemplates();
    
    // Category filter
    const filterButtons = document.querySelectorAll('#templateFilter .nav-link');
    filterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Update active state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Load templates
            const category = button.dataset.category;
            loadTemplates(category);
        });
    });
});