require('dotenv').config();
const mongoose = require('mongoose');
const AdminLayout = require('../src/models/AdminLayout.model');
const SectionLayout = require('../src/models/SectionLayout.model');
const Theme = require('../src/models/Theme.model');

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/resume-job-portal';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB for seeding');
    seedMasters();
}).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

async function seedMasters() {
    try {
        // 1. Seed Theme
        const themeData = {
            name: 'Modern Blue',
            colors: {
                primary: '#2563eb',
                secondary: '#e5e7eb',
                text: '#374151',
                background: '#ffffff'
            },
            fonts: {
                heading: "'Inter', sans-serif",
                body: "'Inter', sans-serif"
            },
            spacing: {
                standard: '20px',
                compact: '10px',
                loose: '30px'
            },
            status: 'Active',
            isDefault: true
        };

        let theme = await Theme.findOne({ name: themeData.name });
        if (!theme) {
            theme = await Theme.create(themeData);
            console.log('Created Theme:', theme.name);
        } else {
            console.log('Theme already exists:', theme.name);
        }

        // 2. Seed Admin Layout (Outer Structure)
        const adminLayoutData = {
            name: 'Modern Standard Layout',
            description: 'A clean, modern layout with a header followed by sections in a single column.',
            htmlContent: `
<div class="resume-wrapper" style="font-family: var(--body-font); color: var(--text); background: var(--background); padding: var(--spacing-standard);">
    {{section.header}}
    
    <div class="resume-body" style="margin-top: var(--spacing-loose);">
        {{section.summary}}
        {{section.skills}}
        {{section.experience}}
        {{section.education}}
        {{section.projects}}
        {{section.certifications}}
        {{section.languages}}
        {{section.awards}}
        {{section.interests}}
        {{section.references}}
    </div>
</div>`,
            cssContent: `
.resume-wrapper {
    max-width: 800px;
    margin: 0 auto;
    line-height: 1.6;
}
.resume-body {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-standard);
}`,
            status: 'Active'
        };

        let adminLayout = await AdminLayout.findOne({ name: adminLayoutData.name });
        if (!adminLayout) {
            adminLayout = await AdminLayout.create(adminLayoutData);
            console.log('Created AdminLayout:', adminLayout.name);
        } else {
            console.log('AdminLayout already exists:', adminLayout.name);
        }

        // 3. Seed Section Layouts
        const sections = [
            {
                name: 'Modern Header',
                sectionType: 'Header',
                htmlContent: `
<header style="border-bottom: 3px solid var(--primary); padding-bottom: var(--spacing-standard); margin-bottom: var(--spacing-loose);">
    <h1 style="color: var(--primary); margin: 0; font-size: 32px; font-family: var(--heading-font);">{{fullName}}</h1>
    <div style="margin-top: 10px; color: #666;">
        <span *ngIf="email">{{email}}</span>
        <span *ngIf="phone"> | {{phone}}</span>
        <span *ngIf="location"> | {{location}}</span>
        <span *ngIf="linkedin"> | <a [href]="linkedin" target="_blank">LinkedIn</a></span>
        <span *ngIf="website"> | <a [href]="website" target="_blank">Portfolio</a></span>
    </div>
    <div *ngIf="jobTitle" style="font-size: 18px; color: var(--text); margin-top: 5px; font-weight: 500;">
        {{jobTitle}}
    </div>
</header>`,
                cssContent: ``,
                isDefault: true
            },
            {
                name: 'Modern Summary',
                sectionType: 'Summary',
                htmlContent: `
<section class="section-summary" *ngIf="profileSummary">
    <h2 style="color: var(--primary); border-bottom: 2px solid var(--secondary); padding-bottom: 5px; font-size: 20px; font-family: var(--heading-font);">Professional Summary</h2>
    <p style="margin-top: 10px;">{{profileSummary}}</p>
</section>`,
                cssContent: ``,
                isDefault: true
            },
            {
                name: 'Modern Experience (Blue Sidebar)',
                sectionType: 'Experience',
                htmlContent: `
<section class="section-experience">
    <h2 style="color: var(--primary); border-bottom: 2px solid var(--secondary); padding-bottom: 5px; font-size: 20px; font-family: var(--heading-font);">Professional Experience</h2>
    <div class="experience-list" style="margin-top: 15px;">
        {{experience}}
    </div>
</section>`,
                cssContent: ``,
                isDefault: true
            },
            {
                name: 'Modern Education',
                sectionType: 'Education',
                htmlContent: `
<section class="section-education">
    <h2 style="color: var(--primary); border-bottom: 2px solid var(--secondary); padding-bottom: 5px; font-size: 20px; font-family: var(--heading-font);">Education</h2>
    <div class="education-list" style="margin-top: 15px;">
        {{education}}
    </div>
</section>`,
                cssContent: ``,
                isDefault: true
            },
            {
                name: 'Modern Skills (Badges)',
                sectionType: 'Skills',
                htmlContent: `
<section class="section-skills">
    <h2 style="color: var(--primary); border-bottom: 2px solid var(--secondary); padding-bottom: 5px; font-size: 20px; font-family: var(--heading-font);">Skills</h2>
    <div class="skills-list" style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 15px;">
        {{skills}}
    </div>
</section>`,
                cssContent: ``,
                isDefault: true
            },
            {
                name: 'Modern Projects',
                sectionType: 'Projects',
                htmlContent: `
<section class="section-projects">
    <h2 style="color: var(--primary); border-bottom: 2px solid var(--secondary); padding-bottom: 5px; font-size: 20px; font-family: var(--heading-font);">Projects</h2>
    <div class="projects-list" style="margin-top: 15px;">
         {{projects}}
    </div>
</section>`,
                cssContent: ``,
                isDefault: true
            }
            // Add other sections as needed: Languages, Certifications, etc.
        ];

        for (const section of sections) {
            let sec = await SectionLayout.findOne({ name: section.name, sectionType: section.sectionType });
            if (!sec) {
                sec = await SectionLayout.create({ ...section, status: 'Active' });
                console.log(`Created SectionLayout: ${section.name} (${section.sectionType})`);
            } else {
                console.log(`SectionLayout already exists: ${section.name}`);
            }
        }

        console.log('Seeding completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('Error seeding masters:', error);
        process.exit(1);
    }
}
