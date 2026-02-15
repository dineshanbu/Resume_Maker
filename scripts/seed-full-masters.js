require('dotenv').config();
const mongoose = require('mongoose');
const AdminLayout = require('../src/models/AdminLayout.model');
const SectionMaster = require('../src/models/SectionMaster.model'); // NEW
const SectionLayout = require('../src/models/SectionLayout.model');
const Theme = require('../src/models/Theme.model');

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/resume-job-portal';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB for hierarchical seeding');
    seedMasters();
}).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

async function seedMasters() {
    try {
        // --- 1. Themes (Keep existing) ---
        const themes = [
            { name: 'Modern Blue', colors: { primary: '#2563eb', secondary: '#e5e7eb', text: '#374151', background: '#ffffff', accent: '#60a5fa' }, fonts: { heading: "'Inter', sans-serif", body: "'Inter', sans-serif" }, spacing: { standard: '20px', compact: '10px', loose: '30px' }, status: 'Active', isDefault: true },
            { name: 'Classic Gray', colors: { primary: '#4b5563', secondary: '#d1d5db', text: '#1f2937', background: '#f9fafb', accent: '#9ca3af' }, fonts: { heading: "'Times New Roman', serif", body: "'Arial', sans-serif" }, spacing: { standard: '24px', compact: '12px', loose: '36px' }, status: 'Active' },
            { name: 'Minimalist Black', colors: { primary: '#000000', secondary: '#f3f4f6', text: '#111827', background: '#ffffff', accent: '#374151' }, fonts: { heading: "'Helvetica Neue', sans-serif", body: "'Helvetica Neue', sans-serif" }, spacing: { standard: '28px', compact: '14px', loose: '40px' }, status: 'Active' },
            { name: 'Creative Purple', colors: { primary: '#7c3aed', secondary: '#ede9fe', text: '#4c1d95', background: '#ffffff', accent: '#8b5cf6' }, fonts: { heading: "'Poppins', sans-serif", body: "'Roboto', sans-serif" }, spacing: { standard: '22px', compact: '12px', loose: '32px' }, status: 'Active' },
            { name: 'Teal Professional', colors: { primary: '#0d9488', secondary: '#ccfbf1', text: '#134e4a', background: '#ffffff', accent: '#2dd4bf' }, fonts: { heading: "'Roboto Slab', serif", body: "'Lato', sans-serif" }, spacing: { standard: '20px', compact: '10px', loose: '30px' }, status: 'Active' },
            { name: 'Nature Green', colors: { primary: '#15803d', secondary: '#dcfce7', text: '#14532d', background: '#ffffff', accent: '#4ade80' }, fonts: { heading: "'Merriweather', serif", body: "'Open Sans', sans-serif" }, spacing: { standard: '22px', compact: '11px', loose: '33px' }, status: 'Active' },
            { name: 'Sunset Orange', colors: { primary: '#ea580c', secondary: '#ffedd5', text: '#7c2d12', background: '#fff7ed', accent: '#fb923c' }, fonts: { heading: "'Playfair Display', serif", body: "'Source Sans Pro', sans-serif" }, spacing: { standard: '24px', compact: '12px', loose: '36px' }, status: 'Active' },
            { name: 'Midnight Blue', colors: { primary: '#1e3a8a', secondary: '#dbeafe', text: '#172554', background: '#f8fafc', accent: '#3b82f6' }, fonts: { heading: "'Montserrat', sans-serif", body: "'Lato', sans-serif" }, spacing: { standard: '20px', compact: '10px', loose: '30px' }, status: 'Active' },
            { name: 'Corporate Red', colors: { primary: '#b91c1c', secondary: '#fee2e2', text: '#450a0a', background: '#ffffff', accent: '#f87171' }, fonts: { heading: "'Oswald', sans-serif", body: "'Roboto', sans-serif" }, spacing: { standard: '22px', compact: '11px', loose: '33px' }, status: 'Active' },
            { name: 'Slate Elegant', colors: { primary: '#475569', secondary: '#f1f5f9', text: '#0f172a', background: '#ffffff', accent: '#94a3b8' }, fonts: { heading: "'Lora', serif", body: "'Inter', sans-serif" }, spacing: { standard: '26px', compact: '13px', loose: '39px' }, status: 'Active' }
        ];

        for (const t of themes) {
            let theme = await Theme.findOne({ name: t.name });
            if (!theme) {
                await Theme.create(t);
                console.log(`Created Theme: ${t.name}`);
            }
        }

        // --- 2. Admin Layouts (New Visual Designs) ---
        console.log('Seeding Admin Layouts...');

        // CLEAR EXISTING LAYOUTS as requested
        await AdminLayout.deleteMany({});
        console.log('Cleared existing AdminLayouts collection.');

        const baseAdminCss = `
            .resume-wrapper { max-width: 850px; margin: 0 auto; line-height: 1.6; color: var(--text); background: var(--background); }
            a { color: var(--primary); text-decoration: none; }
        `;

        const adminLayouts = [
            // 1. Single Column
            {
                name: 'Single Column',
                code: 'single-column',
                description: 'Classic single column layout',
                type: 'one-column',
                columnWidths: { left: 100 },
                htmlContent: `<div class="resume-wrapper"><div style="padding: var(--spacing-loose);">{{section.header}}{{section.summary}}{{section.skills}}{{section.experience}}{{section.education}}{{section.projects}}{{section.languages}}{{section.interests}}{{section.certifications}}{{section.references}}</div></div>`,
                cssContent: `
                    ${baseAdminCss}
                    .resume-wrapper { padding: var(--spacing-loose); }
                `
            },
            // 2. Two Column - Left Sidebar
            {
                name: 'Two Column - Left Sidebar',
                code: 'two-column-left',
                description: 'Sidebar on left (35%), main content on right (65%)',
                type: 'two-column',
                columnWidths: { left: 35, right: 65 },
                htmlContent: `<div class="resume-wrapper" style="display: flex; min-height: 100vh;"><div class="sidebar" style="width: 35%; background: var(--secondary); padding: var(--spacing-standard);">{{section.header}}{{section.skills}}{{section.languages}}{{section.interests}}</div><div class="main" style="width: 65%; padding: var(--spacing-standard);">{{section.summary}}{{section.experience}}{{section.education}}{{section.projects}}</div></div>`,
                cssContent: `
                    ${baseAdminCss}
                    .sidebar { background: var(--secondary); padding: var(--spacing-standard); color: var(--text); }
                    .main { padding: var(--spacing-standard); }
                `
            },
            // 3. Two Column - Right Sidebar
            {
                name: 'Two Column - Right Sidebar',
                code: 'two-column-right',
                description: 'Main content on left (65%), sidebar on right (35%)',
                type: 'two-column',
                columnWidths: { left: 65, right: 35 },
                htmlContent: `<div class="resume-wrapper" style="display: flex; min-height: 100vh;"><div class="main" style="width: 65%; padding: var(--spacing-standard);">{{section.header}}{{section.summary}}{{section.experience}}{{section.projects}}</div><div class="sidebar" style="width: 35%; background: var(--secondary); padding: var(--spacing-standard);">{{section.skills}}{{section.education}}{{section.languages}}</div></div>`,
                cssContent: `
                    ${baseAdminCss}
                    .sidebar { background: var(--secondary); padding: var(--spacing-standard); }
                    .main { padding: var(--spacing-standard); }
                `
            },
            // 4. Two Column - Equal
            {
                name: 'Two Column - Equal',
                code: 'two-column-equal',
                description: 'Equal width columns (50% - 50%)',
                type: 'two-column',
                columnWidths: { left: 50, right: 50 },
                htmlContent: `<div class="resume-wrapper" style="display: flex; min-height: 100vh;"><div style="width: 50%; background: #f9fafb; padding: 30px;">{{section.header}}{{section.summary}}{{section.education}}{{section.skills}}</div><div style="width: 50%; padding: 30px;">{{section.experience}}{{section.projects}}</div></div>`,
                cssContent: `
                    ${baseAdminCss}
                    .column { padding: 30px; }
                    .left-column { background: #f9fafb; }
                `
            },
            // 5. Header + Two Column
            {
                name: 'Header + Two Column',
                code: 'header-two-column',
                description: 'Full-width header, two column body below',
                type: 'header-body',
                columnWidths: { header: 100, left: 35, right: 65 },
                htmlContent: `<div class="resume-wrapper">{{section.header}}<div style="display: flex; padding: 20px;"><div style="width: 35%; background: #f9fafb; padding: 15px;">{{section.education}}{{section.skills}}</div><div style="width: 65%; padding: 15px;">{{section.summary}}{{section.experience}}</div></div></div>`,
                cssContent: `
                    ${baseAdminCss}
                    .body-section { padding: 20px; }
                    .sidebar { background: #f9fafb; padding: 15px; }
                    .main { padding: 15px; }
                `
            },
            // 6. Header + Single Column
            {
                name: 'Header + Single Column',
                code: 'header-single-column',
                description: 'Full-width header, single column body',
                type: 'header-body',
                columnWidths: { header: 100, left: 100, right: 0 },
                htmlContent: `<div class="resume-wrapper">{{section.header}}<div style="padding: 20px;">{{section.summary}}{{section.experience}}{{section.education}}{{section.skills}}{{section.projects}}</div></div>`,
                cssContent: `
                    ${baseAdminCss}
                    .body-section { padding: 20px; }
                `
            },
            // 7. Professional Timeline
            {
                name: 'Professional Timeline',
                code: 'professional-timeline',
                description: 'Unique timeline view for experience',
                type: 'two-column',
                columnWidths: { left: 40, right: 60 },
                htmlContent: `<div class="resume-wrapper" style="display: flex; min-height: 100vh;"><div class="sidebar" style="width: 40%; background: #2c3e50; color: white; padding: var(--spacing-loose);">{{section.header}}{{section.skills}}</div><div class="main" style="width: 60%; padding: var(--spacing-loose);">{{section.summary}}{{section.experience}}{{section.education}}</div></div>`,
                cssContent: `
                    ${baseAdminCss}
                    .sidebar { background: #2c3e50 !important; color: white !important; padding: var(--spacing-loose); }
                    .main { padding: var(--spacing-loose); }
                    .sidebar h1, .sidebar h2, .sidebar h3, .sidebar div { color: white !important; }
                `
            },
            // 8. Modern Grid
            {
                name: 'Modern Grid',
                code: 'creative-grid',
                description: 'Grid-based layout for creative portfolios',
                type: 'header-body',
                columnWidths: { header: 100, left: 30, right: 70 },
                htmlContent: `<div class="resume-wrapper">{{section.header}}<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 20px;"><div style="grid-column: span 2">{{section.summary}}</div><div>{{section.experience}}</div><div>{{section.education}}</div><div>{{section.skills}}</div><div>{{section.projects}}</div></div></div>`,
                cssContent: `
                    ${baseAdminCss}
                    .body-section { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 20px; }
                    /* Grid support in Canvas handled by CDK Drag Drop lists, styles here support export */
                `
            },
            // 9. Executive Brief
            {
                name: 'Executive Brief',
                code: 'executive-brief',
                description: 'High-density executive layout',
                type: 'one-column',
                columnWidths: { header: 100, left: 100 },
                htmlContent: `<div class="resume-wrapper"><div style="border-bottom: 2px solid #333; margin-bottom: 20px;">{{section.header}}</div><div style="display: flex; gap: 40px;"><div style="flex: 2">{{section.experience}}</div><div style="flex: 1; font-size: 0.9em; background: #f4f4f4; padding: 15px;">{{section.skills}}{{section.education}}</div></div></div>`,
                cssContent: `
                    ${baseAdminCss}
                    .header-section { border-bottom: 2px solid #333; margin-bottom: 20px; }
                    .resume-wrapper { display: flex; flex-direction: column; }
                    /* Note: Executive Brief uses a flex body in HTML but Canvas uses Column Lists. 
                       We apply styling to the columns to mimic the look. */
                    .right-column { background: #f4f4f4; padding: 15px; font-size: 0.9em; }
                `
            }
        ];

        for (const al of adminLayouts) {
            await AdminLayout.create(al);
            console.log(`Created AdminLayout: ${al.name}`);
        }

        // --- 3. Section Masters (NEW HIERARCHY) ---
        const sectionMasters = [
            { name: 'Header', code: 'HEADER', icon: 'person' },
            { name: 'Summary', code: 'SUMMARY', icon: 'short_text' },
            { name: 'Experience', code: 'EXPERIENCE', icon: 'work' },
            { name: 'Education', code: 'EDUCATION', icon: 'school' },
            { name: 'Skills', code: 'SKILLS', icon: 'handyman' },
            { name: 'Projects', code: 'PROJECTS', icon: 'code' },
            { name: 'Languages', code: 'LANGUAGES', icon: 'language' },
            { name: 'Certifications', code: 'CERTIFICATIONS', icon: 'verified' },
            { name: 'Awards', code: 'AWARDS', icon: 'emoji_events' },
            { name: 'Interests', code: 'INTERESTS', icon: 'interests' },
            { name: 'References', code: 'REFERENCES', icon: 'contacts' },
            { name: 'Custom', code: 'CUSTOM', icon: 'dashboard_customize' }
        ];

        const masterMap = {}; // name -> _id

        for (const sm of sectionMasters) {
            let master = await SectionMaster.findOne({ code: sm.code });
            if (!master) {
                master = await SectionMaster.create(sm);
                console.log(`Created SectionMaster: ${sm.name}`);
            }
            masterMap[sm.name] = master._id;
        }

        // --- 4. Section Layouts (Linked to Masters) ---

        const styles = [
            { name: 'Standard', cssClass: 'standard' },
            { name: 'Timeline', cssClass: 'timeline' },
            { name: 'Cards', cssClass: 'cards' },
            { name: 'Minimal', cssClass: 'minimal' },
            { name: 'Modern', cssClass: 'modern' },
            { name: 'Compact', cssClass: 'compact' },
            { name: 'Creative', cssClass: 'creative' },
            { name: 'Professional', cssClass: 'professional' },
            { name: 'Elegant', cssClass: 'elegant' },
            { name: 'Tech', cssClass: 'tech' }
        ];

        for (const masterName of Object.keys(masterMap)) {
            const masterId = masterMap[masterName];
            const sectionCode = masterName.toUpperCase();

            for (const style of styles) {
                const layoutName = `${style.name} Style`; // e.g. "Timeline Style"

                // Check if exists for this master
                const exists = await SectionLayout.findOne({ sectionMaster: masterId, name: layoutName });

                if (!exists) {
                    let html = '';
                    let css = '';
                    const placeholder = masterName.toLowerCase();
                    const sectionClass = `section-${placeholder}`;
                    const itemClass = `resume-${placeholder.substring(0, 4)}-item`;

                    // Generate CSS (Reuse logic from v2)
                    css += `.${sectionClass} { margin-bottom: var(--spacing-loose); } `;

                    switch (style.name) {
                        case 'Standard':
                            css += `.${sectionClass} h2 { color: var(--primary); border-bottom: 2px solid var(--secondary); margin-bottom: 15px; }`;
                            css += `.${itemClass} { margin-bottom: 20px; }`;
                            break;
                        case 'Timeline':
                            css += `.${sectionClass} { padding-left: 10px; }`;
                            css += `.${itemClass} { position: relative; padding-left: 25px; margin-bottom: 25px; border-left: 2px solid var(--secondary); }`;
                            css += `.${itemClass}::before { content: ''; position: absolute; left: -6px; top: 0; width: 10px; height: 10px; background: var(--primary); border-radius: 50%; }`;
                            break;
                        case 'Cards':
                            css += `.${itemClass} { background: #fff; border: 1px solid var(--secondary); padding: 15px; border-radius: 8px; margin-bottom: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }`;
                            break;
                        case 'Minimal':
                            css += `.${sectionClass} h2 { border: none; text-transform: uppercase; letter-spacing: 2px; }`;
                            break;
                        // ... Add other cases if needed, using minimal defaults for brevity
                        case 'Modern': css += `.${itemClass} { border-left: 4px solid var(--primary); padding-left: 10px; background: #fafafa; }`; break;
                        case 'Compact': css += `.${sectionClass} { margin-bottom: 10px; } .${itemClass} { margin-bottom: 5px; }`; break;
                        case 'Creative': css += `.${sectionClass} h2 { color: var(--accent); }`; break;
                        case 'Professional': css += `.${sectionClass} h2 { font-family: serif; border-bottom: 1px solid #000; }`; break;
                        case 'Elegant': css += `.${sectionClass} h2 { text-align: center; font-style: italic; }`; break;
                        case 'Tech': css += `.${sectionClass} { font-family: monospace; }`; break;
                    }

                    // HTML Generation
                    if (masterName === 'Header') {
                        if (style.name === 'Standard') html = `<header class="section-header"><h1>{{fullName}}</h1><div>{{jobTitle}}</div><div>{{email}} | {{phone}}</div></header>`;
                        else html = `<header class="section-header style-${style.cssClass}"><h1>{{fullName}}</h1><div>{{jobTitle}}</div><div>{{email}}</div></header>`;
                    } else {
                        html = `<section class="section-${placeholder} style-${style.cssClass}">
                            <h2>${masterName}</h2>
                            {{${placeholder}}}
                        </section>`;
                    }

                    await SectionLayout.create({
                        name: layoutName,
                        sectionMaster: masterId,
                        sectionType: masterName, // Legacy field
                        htmlContent: html,
                        cssContent: css,
                        status: 'Active'
                    });
                    console.log(`Created SectionLayout: ${masterName} - ${layoutName}`);
                }
            }
        }

        console.log('Hierarchical seeding completed!');
        process.exit(0);

    } catch (error) {
        console.error('Error seeding masters:', error);
        process.exit(1);
    }
}
