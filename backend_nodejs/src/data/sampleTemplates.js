// backend/src/data/sampleTemplates.js
// This file contains sample templates to seed the database

const sampleTemplates = [
  {
    name: 'modern-tech',
    displayName: 'Modern Tech Resume',
    description: 'Clean and modern template perfect for software engineers and tech professionals',
    thumbnail: '/templates/thumbnails/modern-tech.png',
    profession: 'Software Engineer',
    styleCategory: 'Modern',
    subscriptionTier: 'free',
    
    htmlTemplate: `
<div class="resume-container">
  <header class="header">
    <h1 class="name">{{personalInfo.fullName}}</h1>
    <div class="contact-info">
      <span class="email">{{personalInfo.email}}</span>
      <span class="phone">{{personalInfo.phone}}</span>
      <span class="location">{{personalInfo.city}}, {{personalInfo.state}}</span>
    </div>
    {{#if personalInfo.linkedin}}
    <div class="social-links">
      <a href="{{personalInfo.linkedin}}">LinkedIn</a>
      {{#if personalInfo.github}}
      <a href="{{personalInfo.github}}">GitHub</a>
      {{/if}}
    </div>
    {{/if}}
  </header>

  {{#if summary}}
  <section class="section summary-section">
    <h2 class="section-title">Professional Summary</h2>
    <p class="summary-text">{{summary}}</p>
  </section>
  {{/if}}

  {{#if skills}}
  <section class="section skills-section">
    <h2 class="section-title">Technical Skills</h2>
    <div class="skills-grid">
      {{#each skills.technical}}
      <span class="skill-tag">{{this}}</span>
      {{/each}}
    </div>
  </section>
  {{/if}}

  {{#if experience}}
  <section class="section experience-section">
    <h2 class="section-title">Work Experience</h2>
    {{#each experience}}
    <div class="experience-item">
      <div class="exp-header">
        <h3 class="job-title">{{jobTitle}}</h3>
        <span class="company">{{company}}</span>
      </div>
      <div class="exp-meta">
        <span class="duration">{{startDate}} - {{#if isCurrentJob}}Present{{else}}{{endDate}}{{/if}}</span>
        {{#if location}}<span class="location">{{location}}</span>{{/if}}
      </div>
      {{#if description}}
      <p class="description">{{description}}</p>
      {{/if}}
      {{#if achievements}}
      <ul class="achievements">
        {{#each achievements}}
        <li>{{this}}</li>
        {{/each}}
      </ul>
      {{/if}}
    </div>
    {{/each}}
  </section>
  {{/if}}

  {{#if education}}
  <section class="section education-section">
    <h2 class="section-title">Education</h2>
    {{#each education}}
    <div class="education-item">
      <h3 class="degree">{{degree}}</h3>
      <div class="institution">{{institution}}</div>
      <div class="edu-meta">
        <span class="duration">{{startDate}} - {{#if isCurrentlyStudying}}Present{{else}}{{endDate}}{{/if}}</span>
        {{#if cgpa}}<span class="grade">CGPA: {{cgpa}}</span>{{/if}}
        {{#if percentage}}<span class="grade">{{percentage}}%</span>{{/if}}
      </div>
    </div>
    {{/each}}
  </section>
  {{/if}}

  {{#if projects}}
  <section class="section projects-section">
    <h2 class="section-title">Projects</h2>
    {{#each projects}}
    <div class="project-item">
      <h3 class="project-title">{{title}}</h3>
      <p class="project-description">{{description}}</p>
      {{#if technologies}}
      <div class="technologies">
        {{#each technologies}}
        <span class="tech-tag">{{this}}</span>
        {{/each}}
      </div>
      {{/if}}
      {{#if link}}
      <a href="{{link}}" class="project-link">View Project</a>
      {{/if}}
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

.resume-container {
  font-family: 'Inter', 'Segoe UI', sans-serif;
  max-width: 850px;
  margin: 0 auto;
  padding: 40px;
  background: white;
  color: #333;
  line-height: 1.6;
}

.header {
  border-bottom: 3px solid #2563eb;
  padding-bottom: 20px;
  margin-bottom: 30px;
}

.name {
  font-size: 36px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 10px;
}

.contact-info {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  font-size: 14px;
  color: #64748b;
}

.contact-info span::before {
  content: '•';
  margin-right: 5px;
}

.contact-info span:first-child::before {
  content: '';
  margin-right: 0;
}

.social-links {
  margin-top: 10px;
  display: flex;
  gap: 15px;
}

.social-links a {
  color: #2563eb;
  text-decoration: none;
  font-size: 14px;
}

.section {
  margin-bottom: 30px;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 15px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e2e8f0;
}

.summary-text {
  font-size: 15px;
  color: #475569;
  text-align: justify;
}

.skills-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.skill-tag {
  background: #eff6ff;
  color: #1e40af;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}

.experience-item,
.education-item,
.project-item {
  margin-bottom: 25px;
}

.exp-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 5px;
}

.job-title,
.degree,
.project-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.company,
.institution {
  font-size: 16px;
  color: #2563eb;
  font-weight: 500;
}

.exp-meta,
.edu-meta {
  display: flex;
  gap: 15px;
  font-size: 13px;
  color: #64748b;
  margin-bottom: 10px;
}

.description {
  font-size: 14px;
  color: #475569;
  margin-bottom: 10px;
}

.achievements {
  list-style-position: inside;
  font-size: 14px;
  color: #475569;
}

.achievements li {
  margin-bottom: 5px;
  padding-left: 5px;
}

.technologies {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.tech-tag {
  background: #f1f5f9;
  color: #334155;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
}

.project-link {
  color: #2563eb;
  text-decoration: none;
  font-size: 13px;
  margin-top: 5px;
  display: inline-block;
}

@media print {
  .resume-container {
    padding: 20px;
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
      certifications: false,
      languages: false,
      achievements: false,
      interests: false,
      references: false
    },
    
    tags: ['modern', 'tech', 'software', 'clean', 'professional']
  },

  // Professional Classic Template
  {
    name: 'classic-professional',
    displayName: 'Classic Professional',
    description: 'Traditional and elegant template suitable for all professions',
    thumbnail: '/templates/thumbnails/classic-professional.png',
    profession: 'General',
    styleCategory: 'Classic',
    subscriptionTier: 'free',
    
    htmlTemplate: `
<div class="resume-container">
  <header class="header">
    <h1 class="name">{{personalInfo.fullName}}</h1>
    <div class="title">{{personalInfo.jobTitle}}</div>
    <div class="contact-bar">
      {{personalInfo.email}} | {{personalInfo.phone}} | {{personalInfo.address}}
    </div>
  </header>

  <hr class="divider" />

  {{#if summary}}
  <section class="section">
    <h2 class="section-heading">PROFESSIONAL SUMMARY</h2>
    <p>{{summary}}</p>
  </section>
  {{/if}}

  {{#if experience}}
  <section class="section">
    <h2 class="section-heading">PROFESSIONAL EXPERIENCE</h2>
    {{#each experience}}
    <div class="entry">
      <div class="entry-header">
        <strong>{{jobTitle}}</strong> | {{company}}
      </div>
      <div class="entry-meta">{{startDate}} - {{#if isCurrentJob}}Present{{else}}{{endDate}}{{/if}}</div>
      <p>{{description}}</p>
      {{#if achievements}}
      <ul>
        {{#each achievements}}
        <li>{{this}}</li>
        {{/each}}
      </ul>
      {{/if}}
    </div>
    {{/each}}
  </section>
  {{/if}}

  {{#if education}}
  <section class="section">
    <h2 class="section-heading">EDUCATION</h2>
    {{#each education}}
    <div class="entry">
      <strong>{{degree}}</strong> | {{institution}}
      <div class="entry-meta">
        {{startDate}} - {{#if isCurrentlyStudying}}Present{{else}}{{endDate}}{{/if}}
        {{#if cgpa}} | CGPA: {{cgpa}}{{/if}}
      </div>
    </div>
    {{/each}}
  </section>
  {{/if}}

  {{#if skills}}
  <section class="section">
    <h2 class="section-heading">SKILLS</h2>
    <p>{{#each skills.technical}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}</p>
  </section>
  {{/if}}
</div>
    `,
    
    cssTemplate: `
.resume-container {
  font-family: 'Times New Roman', serif;
  max-width: 800px;
  margin: 0 auto;
  padding: 40px;
  background: white;
  color: #000;
  line-height: 1.8;
}

.header {
  text-align: center;
  margin-bottom: 20px;
}

.name {
  font-size: 32px;
  font-weight: bold;
  letter-spacing: 2px;
  margin-bottom: 5px;
}

.title {
  font-size: 18px;
  font-style: italic;
  margin-bottom: 10px;
}

.contact-bar {
  font-size: 12px;
  color: #555;
}

.divider {
  border: none;
  border-top: 2px solid #000;
  margin: 20px 0;
}

.section {
  margin-bottom: 25px;
}

.section-heading {
  font-size: 16px;
  font-weight: bold;
  letter-spacing: 1px;
  border-bottom: 1px solid #000;
  padding-bottom: 5px;
  margin-bottom: 15px;
}

.entry {
  margin-bottom: 20px;
}

.entry-header {
  font-size: 14px;
  margin-bottom: 5px;
}

.entry-meta {
  font-size: 12px;
  font-style: italic;
  color: #555;
  margin-bottom: 10px;
}

ul {
  margin-left: 20px;
  font-size: 13px;
}

li {
  margin-bottom: 5px;
}
    `,
    
    availableSections: {
      personalInfo: true,
      summary: true,
      experience: true,
      education: true,
      skills: true,
      projects: false,
      certifications: true,
      languages: false,
      achievements: false,
      interests: false,
      references: true
    },
    
    tags: ['classic', 'traditional', 'professional', 'formal']
  },

  // Creative Designer Template
  {
    name: 'creative-designer',
    displayName: 'Creative Designer',
    description: 'Bold and creative template for designers and creative professionals',
    thumbnail: '/templates/thumbnails/creative-designer.png',
    profession: 'Designer',
    styleCategory: 'Creative',
    subscriptionTier: 'basic',
    
    htmlTemplate: `
<div class="resume-container">
  <aside class="sidebar">
    <div class="profile-section">
      {{#if personalInfo.profileImage}}
      <img src="{{personalInfo.profileImage}}" alt="Profile" class="profile-img" />
      {{/if}}
      <h1 class="name">{{personalInfo.fullName}}</h1>
      <div class="tagline">{{personalInfo.jobTitle}}</div>
    </div>

    <div class="contact-section">
      <h3 class="sidebar-heading">CONTACT</h3>
      <div class="contact-item">{{personalInfo.email}}</div>
      <div class="contact-item">{{personalInfo.phone}}</div>
      <div class="contact-item">{{personalInfo.location}}</div>
    </div>

    {{#if skills}}
    <div class="skills-section">
      <h3 class="sidebar-heading">SKILLS</h3>
      {{#each skills.technical}}
      <div class="skill-item">
        <span class="skill-name">{{this}}</span>
        <div class="skill-bar">
          <div class="skill-fill"></div>
        </div>
      </div>
      {{/each}}
    </div>
    {{/if}}
  </aside>

  <main class="main-content">
    {{#if summary}}
    <section class="section">
      <h2 class="section-title">About Me</h2>
      <p class="summary">{{summary}}</p>
    </section>
    {{/if}}

    {{#if experience}}
    <section class="section">
      <h2 class="section-title">Experience</h2>
      {{#each experience}}
      <div class="timeline-item">
        <div class="timeline-marker"></div>
        <div class="timeline-content">
          <h3 class="item-title">{{jobTitle}}</h3>
          <div class="item-subtitle">{{company}} | {{startDate}} - {{#if isCurrentJob}}Present{{else}}{{endDate}}{{/if}}</div>
          <p>{{description}}</p>
        </div>
      </div>
      {{/each}}
    </section>
    {{/if}}

    {{#if projects}}
    <section class="section">
      <h2 class="section-title">Portfolio</h2>
      <div class="projects-grid">
        {{#each projects}}
        <div class="project-card">
          <h4>{{title}}</h4>
          <p>{{description}}</p>
        </div>
        {{/each}}
      </div>
    </section>
    {{/if}}
  </main>
</div>
    `,
    
    cssTemplate: `
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.resume-container {
  display: grid;
  grid-template-columns: 300px 1fr;
  font-family: 'Poppins', sans-serif;
  background: white;
  min-height: 100vh;
}

.sidebar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px 30px;
}

.profile-section {
  text-align: center;
  margin-bottom: 40px;
}

.profile-img {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  border: 5px solid white;
  margin-bottom: 20px;
}

.name {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 10px;
}

.tagline {
  font-size: 14px;
  opacity: 0.9;
}

.sidebar-heading {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 2px;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid rgba(255,255,255,0.3);
}

.contact-section,
.skills-section {
  margin-bottom: 30px;
}

.contact-item {
  font-size: 13px;
  margin-bottom: 10px;
  opacity: 0.9;
}

.skill-item {
  margin-bottom: 15px;
}

.skill-name {
  display: block;
  font-size: 13px;
  margin-bottom: 5px;
}

.skill-bar {
  height: 6px;
  background: rgba(255,255,255,0.3);
  border-radius: 3px;
  overflow: hidden;
}

.skill-fill {
  height: 100%;
  background: white;
  width: 85%;
  border-radius: 3px;
}

.main-content {
  padding: 60px 50px;
  background: #f8f9fa;
}

.section {
  margin-bottom: 40px;
}

.section-title {
  font-size: 32px;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 25px;
  position: relative;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 0;
  width: 60px;
  height: 4px;
  background: #764ba2;
}

.summary {
  font-size: 15px;
  line-height: 1.8;
  color: #555;
}

.timeline-item {
  display: flex;
  margin-bottom: 30px;
  position: relative;
}

.timeline-marker {
  width: 12px;
  height: 12px;
  background: #667eea;
  border-radius: 50%;
  margin-right: 20px;
  margin-top: 5px;
  flex-shrink: 0;
}

.timeline-content {
  flex: 1;
}

.item-title {
  font-size: 20px;
  color: #333;
  margin-bottom: 5px;
}

.item-subtitle {
  font-size: 14px;
  color: #777;
  margin-bottom: 10px;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.project-card {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.project-card h4 {
  color: #667eea;
  margin-bottom: 10px;
}

@media print {
  .resume-container {
    grid-template-columns: 250px 1fr;
  }
  .main-content {
    padding: 40px 30px;
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
      achievements: true,
      interests: true,
      references: false
    },
    
    isPremium: false,
    tags: ['creative', 'designer', 'colorful', 'portfolio', 'modern']
  }
];

module.exports = sampleTemplates;