// backend/src/data/readyTemplates.js
// Collection of ready-to-use templates for admin to import

const readyTemplates = [
  // ============================================
  // 1. PROFESSIONAL BLUE - Software Engineer
  // ============================================
  {
    name: 'professional-blue-tech',
    displayName: 'Professional Blue - Tech',
    description: 'Clean and professional template perfect for software engineers and tech professionals. Features a modern blue color scheme.',
    thumbnail: '/templates/thumbnails/professional-blue.png',
    profession: 'Software Engineer',
    styleCategory: 'Modern',
    subscriptionTier: 'free',
    
    colorScheme: {
      primary: '#1e40af',
      secondary: '#3b82f6',
      accent: '#60a5fa',
      text: '#1f2937',
      background: '#ffffff'
    },
    
    htmlTemplate: `
<div class="resume-wrapper">
  <header class="resume-header">
    <h1 class="name">{{personalInfo.fullName}}</h1>
    <div class="contact-bar">
      <span class="contact-item">📧 {{personalInfo.email}}</span>
      <span class="contact-item">📱 {{personalInfo.phone}}</span>
      <span class="contact-item">📍 {{personalInfo.city}}, {{personalInfo.state}}</span>
    </div>
    {{#if personalInfo.linkedin}}
    <div class="social-links">
      <a href="{{personalInfo.linkedin}}" class="social-link">LinkedIn</a>
      {{#if personalInfo.github}}
      <a href="{{personalInfo.github}}" class="social-link">GitHub</a>
      {{/if}}
      {{#if personalInfo.portfolio}}
      <a href="{{personalInfo.portfolio}}" class="social-link">Portfolio</a>
      {{/if}}
    </div>
    {{/if}}
  </header>

  {{#if summary}}
  <section class="resume-section">
    <h2 class="section-heading">Professional Summary</h2>
    <div class="section-divider"></div>
    <p class="summary-text">{{summary}}</p>
  </section>
  {{/if}}

  {{#if skills.technical}}
  <section class="resume-section">
    <h2 class="section-heading">Technical Skills</h2>
    <div class="section-divider"></div>
    <div class="skills-container">
      {{#each skills.technical}}
      <span class="skill-badge">{{this}}</span>
      {{/each}}
    </div>
  </section>
  {{/if}}

  {{#if experience}}
  <section class="resume-section">
    <h2 class="section-heading">Work Experience</h2>
    <div class="section-divider"></div>
    {{#each experience}}
    <div class="timeline-item">
      <div class="timeline-marker"></div>
      <div class="timeline-content">
        <h3 class="item-title">{{jobTitle}}</h3>
        <div class="item-company">{{company}}</div>
        <div class="item-date">
          {{formatDate startDate}} - {{#if isCurrentJob}}Present{{else}}{{formatDate endDate}}{{/if}}
          {{#if location}} • {{location}}{{/if}}
        </div>
        {{#if description}}
        <p class="item-description">{{description}}</p>
        {{/if}}
        {{#if achievements}}
        <ul class="achievements-list">
          {{#each achievements}}
          <li>{{this}}</li>
          {{/each}}
        </ul>
        {{/if}}
      </div>
    </div>
    {{/each}}
  </section>
  {{/if}}

  {{#if education}}
  <section class="resume-section">
    <h2 class="section-heading">Education</h2>
    <div class="section-divider"></div>
    {{#each education}}
    <div class="education-item">
      <h3 class="item-title">{{degree}}</h3>
      <div class="item-institution">{{institution}}</div>
      <div class="item-date">
        {{formatDate startDate}} - {{#if isCurrentlyStudying}}Present{{else}}{{formatDate endDate}}{{/if}}
      </div>
      {{#if cgpa}}
      <div class="item-grade">CGPA: {{cgpa}}/10</div>
      {{/if}}
      {{#if percentage}}
      <div class="item-grade">{{percentage}}%</div>
      {{/if}}
    </div>
    {{/each}}
  </section>
  {{/if}}

  {{#if projects}}
  <section class="resume-section">
    <h2 class="section-heading">Projects</h2>
    <div class="section-divider"></div>
    {{#each projects}}
    <div class="project-item">
      <h3 class="item-title">{{title}}</h3>
      <p class="project-description">{{description}}</p>
      {{#if technologies}}
      <div class="tech-tags">
        {{#each technologies}}
        <span class="tech-tag">{{this}}</span>
        {{/each}}
      </div>
      {{/if}}
      {{#if link}}
      <a href="{{link}}" class="project-link">View Project →</a>
      {{/if}}
    </div>
    {{/each}}
  </section>
  {{/if}}

  {{#if certifications}}
  <section class="resume-section">
    <h2 class="section-heading">Certifications</h2>
    <div class="section-divider"></div>
    {{#each certifications}}
    <div class="cert-item">
      <strong>{{name}}</strong> - {{issuer}}
      {{#if issueDate}} ({{formatDate issueDate}}){{/if}}
    </div>
    {{/each}}
  </section>
  {{/if}}
</div>
    `,
    
    cssTemplate: `
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.resume-wrapper {
  font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  max-width: 850px;
  margin: 0 auto;
  padding: 40px;
  background: #ffffff;
  color: #1f2937;
  line-height: 1.6;
}

/* Header Styles */
.resume-header {
  text-align: center;
  padding-bottom: 30px;
  border-bottom: 3px solid #1e40af;
  margin-bottom: 30px;
}

.name {
  font-size: 42px;
  font-weight: 700;
  color: #1e40af;
  margin-bottom: 10px;
  letter-spacing: -0.5px;
}

.contact-bar {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
  margin-top: 15px;
  font-size: 14px;
  color: #6b7280;
}

.contact-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.social-links {
  margin-top: 15px;
  display: flex;
  justify-content: center;
  gap: 15px;
}

.social-link {
  color: #1e40af;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.2s;
}

.social-link:hover {
  color: #3b82f6;
  text-decoration: underline;
}

/* Section Styles */
.resume-section {
  margin-bottom: 30px;
}

.section-heading {
  font-size: 22px;
  font-weight: 700;
  color: #1e40af;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 5px;
}

.section-divider {
  width: 60px;
  height: 3px;
  background: linear-gradient(to right, #1e40af, #3b82f6);
  margin-bottom: 20px;
}

/* Summary */
.summary-text {
  font-size: 15px;
  color: #4b5563;
  text-align: justify;
  line-height: 1.8;
}

/* Skills */
.skills-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.skill-badge {
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  display: inline-block;
}

/* Timeline Items (Experience/Education) */
.timeline-item {
  position: relative;
  padding-left: 30px;
  margin-bottom: 25px;
}

.timeline-marker {
  position: absolute;
  left: 0;
  top: 5px;
  width: 12px;
  height: 12px;
  background: #1e40af;
  border-radius: 50%;
  border: 3px solid #e5e7eb;
}

.timeline-item:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 17px;
  bottom: -25px;
  width: 2px;
  background: #e5e7eb;
}

.timeline-content {
  padding-left: 10px;
}

.item-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 5px;
}

.item-company,
.item-institution {
  font-size: 16px;
  color: #1e40af;
  font-weight: 500;
  margin-bottom: 5px;
}

.item-date {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 10px;
}

.item-description {
  font-size: 14px;
  color: #4b5563;
  margin-bottom: 10px;
  text-align: justify;
}

.achievements-list {
  list-style-position: inside;
  font-size: 14px;
  color: #4b5563;
  padding-left: 5px;
}

.achievements-list li {
  margin-bottom: 5px;
  padding-left: 10px;
}

/* Education */
.education-item {
  margin-bottom: 20px;
}

.item-grade {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

/* Projects */
.project-item {
  margin-bottom: 20px;
  padding: 15px;
  background: #f9fafb;
  border-left: 3px solid #1e40af;
  border-radius: 4px;
}

.project-description {
  font-size: 14px;
  color: #4b5563;
  margin: 10px 0;
}

.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 10px 0;
}

.tech-tag {
  background: #e5e7eb;
  color: #374151;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.project-link {
  color: #1e40af;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  display: inline-block;
  margin-top: 5px;
}

.project-link:hover {
  text-decoration: underline;
}

/* Certifications */
.cert-item {
  font-size: 14px;
  color: #4b5563;
  margin-bottom: 10px;
  padding-left: 15px;
  position: relative;
}

.cert-item::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #1e40af;
  font-weight: bold;
}

/* Print Styles */
@media print {
  .resume-wrapper {
    padding: 20px;
    max-width: 100%;
  }
  
  .section-heading {
    page-break-after: avoid;
  }
  
  .timeline-item,
  .project-item {
    page-break-inside: avoid;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .resume-wrapper {
    padding: 20px;
  }
  
  .name {
    font-size: 32px;
  }
  
  .contact-bar {
    flex-direction: column;
    gap: 8px;
  }
}
    `,
    
    availableSections: {
      personalInfo: true,
      summary: true,
      experience: true,
      education: true,
      skills: true,
      projects: true,
      certifications: true,
      languages: false,
      achievements: false,
      interests: false,
      references: false
    },
    
    tags: ['professional', 'modern', 'tech', 'blue', 'clean']
  },

  // ============================================
  // 2. MINIMALIST BLACK - General
  // ============================================
  {
    name: 'minimalist-black',
    displayName: 'Minimalist Black & White',
    description: 'Ultra-clean minimalist design in black and white. Perfect for any profession seeking an elegant, distraction-free presentation.',
    thumbnail: '/templates/thumbnails/minimalist-black.png',
    profession: 'General',
    styleCategory: 'Minimal',
    subscriptionTier: 'free',
    
    colorScheme: {
      primary: '#000000',
      secondary: '#333333',
      accent: '#666666',
      text: '#000000',
      background: '#ffffff'
    },
    
    htmlTemplate: `
<div class="resume-minimal">
  <div class="header-minimal">
    <h1 class="name-minimal">{{personalInfo.fullName}}</h1>
    <div class="tagline">{{personalInfo.jobTitle}}</div>
    <div class="contact-minimal">
      {{personalInfo.email}} • {{personalInfo.phone}} • {{personalInfo.city}}
    </div>
  </div>

  <div class="divider-minimal"></div>

  {{#if summary}}
  <section class="section-minimal">
    <h2 class="heading-minimal">SUMMARY</h2>
    <p class="text-minimal">{{summary}}</p>
  </section>
  {{/if}}

  {{#if experience}}
  <section class="section-minimal">
    <h2 class="heading-minimal">EXPERIENCE</h2>
    {{#each experience}}
    <div class="entry-minimal">
      <div class="entry-header-minimal">
        <strong class="entry-title">{{jobTitle}}</strong>
        <span class="entry-date">{{formatDate startDate}} - {{#if isCurrentJob}}Present{{else}}{{formatDate endDate}}{{/if}}</span>
      </div>
      <div class="entry-subtitle">{{company}}</div>
      {{#if description}}
      <p class="entry-text">{{description}}</p>
      {{/if}}
    </div>
    {{/each}}
  </section>
  {{/if}}

  {{#if education}}
  <section class="section-minimal">
    <h2 class="heading-minimal">EDUCATION</h2>
    {{#each education}}
    <div class="entry-minimal">
      <div class="entry-header-minimal">
        <strong class="entry-title">{{degree}}</strong>
        <span class="entry-date">{{formatDate startDate}} - {{#if isCurrentlyStudying}}Present{{else}}{{formatDate endDate}}{{/if}}</span>
      </div>
      <div class="entry-subtitle">{{institution}}</div>
      {{#if cgpa}}
      <div class="entry-text">CGPA: {{cgpa}}</div>
      {{/if}}
    </div>
    {{/each}}
  </section>
  {{/if}}

  {{#if skills.technical}}
  <section class="section-minimal">
    <h2 class="heading-minimal">SKILLS</h2>
    <div class="skills-minimal">
      {{#each skills.technical}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
    </div>
  </section>
  {{/if}}
</div>
    `,
    
    cssTemplate: `
.resume-minimal {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  max-width: 800px;
  margin: 0 auto;
  padding: 60px 40px;
  background: white;
  color: #000;
  line-height: 1.6;
}

.header-minimal {
  text-align: center;
  margin-bottom: 40px;
}

.name-minimal {
  font-size: 36px;
  font-weight: 300;
  letter-spacing: 2px;
  margin-bottom: 10px;
}

.tagline {
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 3px;
  color: #666;
  margin-bottom: 15px;
}

.contact-minimal {
  font-size: 12px;
  color: #666;
  letter-spacing: 1px;
}

.divider-minimal {
  width: 100%;
  height: 1px;
  background: #000;
  margin: 30px 0;
}

.section-minimal {
  margin-bottom: 30px;
}

.heading-minimal {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 2px;
  border-bottom: 2px solid #000;
  padding-bottom: 8px;
  margin-bottom: 20px;
}

.text-minimal {
  font-size: 13px;
  text-align: justify;
}

.entry-minimal {
  margin-bottom: 20px;
}

.entry-header-minimal {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 5px;
}

.entry-title {
  font-size: 14px;
  font-weight: 600;
}

.entry-date {
  font-size: 11px;
  color: #666;
  font-style: italic;
}

.entry-subtitle {
  font-size: 13px;
  color: #333;
  margin-bottom: 8px;
}

.entry-text {
  font-size: 12px;
  color: #333;
  text-align: justify;
}

.skills-minimal {
  font-size: 13px;
  line-height: 1.8;
}

@media print {
  .resume-minimal {
    padding: 30px;
  }
}
    `,
    
    availableSections: {
      personalInfo: true,
      summary: true,
      experience: true,
      education: true,
      skills: true,
      projects: false,
      certifications: false,
      languages: false,
      achievements: false,
      interests: false,
      references: false
    },
    
    tags: ['minimalist', 'clean', 'simple', 'black', 'white', 'elegant']
  }
];

module.exports = readyTemplates;