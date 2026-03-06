require('dotenv').config();
const mongoose = require('mongoose');
const SectionLayout = require('../src/models/SectionLayout.model');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/resume-job-portal';

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB for SectionLayout seeding');
        seedSectionLayouts();
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

async function seedSectionLayouts() {
    try {
        console.log('Clearing existing section layouts and dropping indexes...');
        await SectionLayout.collection.dropIndexes();
        await SectionLayout.deleteMany({});

        const layouts = [
            // HEADERS
            {
                sectionType: 'header',
                layoutName: 'Royal Prism',
                layoutKey: 'header-royal-prism',
                html: `<div class="h-prism">
                    <div class="h-accent"></div>
                    <div class="h-content">
                        <div class="h-left">
                            <h1>{{fullName}}</h1>
                            <h2>{{jobTitle}}</h2>
                        </div>
                        <div class="h-right">
                            <div class="contact-pill"><i class="bi bi-envelope"></i> {{email}}</div>
                            <div class="contact-pill"><i class="bi bi-telephone"></i> {{phone}}</div>
                            <div class="contact-pill"><i class="bi bi-geo-alt"></i> {{location}}</div>
                        </div>
                    </div>
                </div>`,
                css: `.h-prism { position: relative; padding: 40px 0; margin-bottom: 30px; }
                      .h-accent { position: absolute; top: 0; left: 0; width: 60px; height: 100%; background: #8e3650; opacity: 0.1; border-radius: 0 50px 50px 0; }
                      .h-content { display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 1; padding: 0 20px; }
                      .h-prism h1 { font-size: 3.2rem; font-weight: 800; margin: 0; color: #1a1a1a; letter-spacing: -1px; line-height: 1; }
                      .h-prism h2 { font-size: 1.2rem; font-weight: 500; color: #8e3650; text-transform: uppercase; margin-top: 10px; letter-spacing: 2px; }
                      .h-right { display: flex; flex-direction: column; gap: 8px; }
                      .contact-pill { font-size: 0.85rem; color: #666; display: flex; align-items: center; gap: 8px; justify-content: flex-end; }
                      .contact-pill i { color: #8e3650; }`,
                isPremium: true,
                isActive: true
            },
            {
                sectionType: 'header',
                layoutName: 'Executive Sidebar',
                layoutKey: 'header-executive',
                html: `<div class="h-executive">
                    <div class="id-block">
                        <h1>{{fullName}}</h1>
                        <p>{{jobTitle}}</p>
                    </div>
                    <div class="h-divider"></div>
                    <div class="info-block">
                        <div class="item"><span>EMAIL</span> {{email}}</div>
                        <div class="item"><span>PHONE</span> {{phone}}</div>
                        <div class="item"><span>LOCATION</span> {{location}}</div>
                    </div>
                </div>`,
                css: `.h-executive { display: flex; align-items: stretch; gap: 40px; border-bottom: 4px solid #f0f0f0; padding-bottom: 30px; margin-bottom: 40px; }
                      .id-block { flex: 1; }
                      .id-block h1 { font-size: 2.8rem; margin: 0; color: #333; }
                      .id-block p { font-size: 1rem; color: #8e3650; font-weight: 600; margin-top: 5px; }
                      .h-divider { width: 1px; background: #e0e0e0; }
                      .info-block { display: flex; flex-direction: column; justify-content: center; gap: 12px; }
                      .info-block .item { font-size: 0.8rem; color: #444; }
                      .info-block .item span { display: block; font-weight: 800; color: #999; font-size: 0.65rem; letter-spacing: 1px; margin-bottom: 2px; }`,
                isPremium: false,
                isActive: true
            },
            {
                sectionType: 'header',
                layoutName: 'Minimalist Signature',
                layoutKey: 'header-minimal-sig',
                html: `<div class="h-signature">
                    <div class="name-container">
                        <h1>{{fullName}}</h1>
                        <div class="line"></div>
                    </div>
                    <p class="role-title">{{jobTitle}}</p>
                    <div class="contact-footer">
                        <span>{{email}}</span> &bull; <span>{{phone}}</span> &bull; <span>{{location}}</span>
                    </div>
                </div>`,
                css: `.h-signature { text-align: center; padding: 50px 0; margin-bottom: 20px; }
                      .name-container { display: inline-block; position: relative; }
                      .h-signature h1 { font-size: 2.8rem; font-weight: 300; margin: 0; color: #222; letter-spacing: 4px; text-transform: uppercase; }
                      .h-signature .line { height: 2px; width: 40px; background: #8e3650; margin: 15px auto; }
                      .role-title { font-size: 1rem; color: #666; font-style: italic; margin-bottom: 15px; }
                      .contact-footer { font-size: 0.8rem; color: #999; letter-spacing: 1px; }`,
                isPremium: false,
                isActive: true
            },
            {
                sectionType: 'header',
                layoutName: 'Digital Badge',
                layoutKey: 'header-digital-badge',
                html: `<div class="h-badge">
                    <div class="main-bar">
                        <div class="badge-icon">{{fullName}}</div>
                        <div class="name-area">
                            <h1>{{fullName}}</h1>
                            <h2>{{jobTitle}}</h2>
                        </div>
                    </div>
                    <div class="sub-bar">
                        <span><i class="bi bi-envelope-at"></i> {{email}}</span>
                        <span><i class="bi bi-phone-vibrate"></i> {{phone}}</span>
                        <span><i class="bi bi-geo"></i> {{location}}</span>
                    </div>
                </div>`,
                css: `.h-badge { margin-bottom: 40px; }
                      .main-bar { display: flex; align-items: center; gap: 20px; background: #1a1f26; color: white; padding: 25px; border-radius: 16px; margin-bottom: 15px; }
                      .badge-icon { width: 60px; height: 60px; background: #8e3650; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; font-weight: 800; overflow: hidden; text-transform: uppercase; flex-shrink: 0; }
                      .name-area h1 { font-size: 2rem; margin: 0; font-weight: 700; }
                      .name-area h2 { font-size: 0.9rem; margin: 5px 0 0 0; color: rgba(255,255,255,0.6); font-weight: 400; }
                      .sub-bar { display: flex; justify-content: space-around; padding: 12px; border: 1px solid #eee; border-radius: 12px; font-size: 0.8rem; color: #666; }
                      .sub-bar i { color: #8e3650; margin-right: 5px; }`,
                isPremium: true,
                isActive: true
            },
            {
                sectionType: 'header',
                layoutName: 'Split Dual-Tone',
                layoutKey: 'header-dual-tone',
                html: `<div class="h-dual">
                    <div class="dark-side">
                        <h1>{{fullName}}</h1>
                        <p>{{jobTitle}}</p>
                    </div>
                    <div class="light-side">
                        <div class="contact-item">
                            <div class="c-icon"><i class="bi bi-envelope"></i></div>
                            <div class="c-text">Email Address<br><strong>{{email}}</strong></div>
                        </div>
                        <div class="contact-item">
                            <div class="c-icon"><i class="bi bi-geo-alt"></i></div>
                            <div class="c-text">Location<br><strong>{{location}}</strong></div>
                        </div>
                    </div>
                </div>`,
                css: `.h-dual { display: flex; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); margin-bottom: 40px; border: 1px solid #eee; }
                      .dark-side { flex: 1.4; background: #8e3650; color: white; padding: 30px; display: flex; flex-direction: column; justify-content: center; }
                      .dark-side h1 { font-size: 2.22rem; margin: 0; font-weight: 900; line-height: 1.1; text-transform: uppercase; }
                      .dark-side p { margin-top: 8px; font-size: 1rem; opacity: 0.9; }
                      .light-side { flex: 1; background: #fff; padding: 30px; display: flex; flex-direction: column; justify-content: center; gap: 15px; }
                      .contact-item { display: flex; gap: 12px; align-items: center; }
                      .c-icon { width: 32px; height: 32px; background: #fff1f2; color: #8e3650; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1rem; }
                      .c-text { font-size: 0.7rem; color: #888; line-height: 1.3; }
                      .c-text strong { color: #333; font-size: 0.85rem; }`,
                isPremium: true,
                isActive: true
            },

            // SUMMARY
            {
                sectionType: 'summary',
                layoutName: 'Standard Paragraph',
                layoutKey: 'summary-standard',
                html: `<div class="summary-section">
                    <h3>Professional Summary</h3>
                    <p>{{summary}}</p>
                </div>`,
                css: `.summary-section h3 { border-bottom: 1px solid #ddd; margin-bottom: 10px; padding-bottom: 5px; }
                      .summary-section p { line-height: 1.6; color: #444; }`,
                isPremium: false,
                isActive: true
            },
            {
                sectionType: 'summary',
                layoutName: 'Bullet Points',
                layoutKey: 'summary-bullets',
                html: `<div class="summary-bullets">
                    <h4>Profile Highlights</h4>
                    <ul>
                        {{#each summaryItems}}<li>{{this}}</li>{{/each}}
                    </ul>
                </div>`,
                css: `.summary-bullets h4 { color: #8e3650; margin-bottom: 8px; }
                      .summary-bullets ul { padding-left: 20px; }`,
                isPremium: true,
                isActive: true
            },
            {
                sectionType: 'summary',
                layoutName: 'Quote Style',
                layoutKey: 'summary-quote',
                html: `<div class="summary-quote">
                    <i class="bi bi-quote"></i>
                    <p>{{summary}}</p>
                </div>`,
                css: `.summary-quote { position: relative; padding: 20px; font-style: italic; background: #f9f9f9; border-left: 4px solid #8e3650; }
                      .summary-quote i { position: absolute; top: 10px; left: 10px; opacity: 0.1; font-size: 2rem; }`,
                isPremium: true,
                isActive: true
            },
            {
                sectionType: 'summary',
                layoutName: 'Minimalist Inline',
                layoutKey: 'summary-minimal',
                html: `<div class="summary-minimal">
                    <p><strong>SUMMARY:</strong> {{summary}}</p>
                </div>`,
                css: `.summary-minimal p { font-size: 0.95rem; line-height: 1.5; }`,
                isPremium: false,
                isActive: true
            },
            {
                sectionType: 'summary',
                layoutName: 'Background Block',
                layoutKey: 'summary-bg-block',
                html: `<div class="summary-bg-block">
                    <div class="inner">
                        <p>{{summary}}</p>
                    </div>
                </div>`,
                css: `.summary-bg-block { margin-bottom: 2rem; }
                      .summary-bg-block .inner { background: #333; color: #fff; padding: 20px; border-radius: 4px; }`,
                isPremium: true,
                isActive: true
            },

            // EXPERIENCE
            {
                sectionType: 'experience',
                layoutName: 'Clean Timeline',
                layoutKey: 'experience-clean-timeline',
                html: `<div class="experience-list">
                    {{#each experience}}
                    <div class="exp-item">
                        <div class="date">{{date}}</div>
                        <div class="details">
                            <div class="role">{{title}}</div>
                            <div class="company">{{company}}</div>
                            <div class="desc">{{description}}</div>
                        </div>
                    </div>
                    {{/each}}
                </div>`,
                css: `.exp-item { display: flex; gap: 20px; margin-bottom: 1.5rem; }
                      .exp-item .date { width: 120px; font-weight: bold; color: #8e3650; }
                      .exp-item .role { font-size: 1.1rem; font-weight: bold; }
                      .exp-item .company { font-style: italic; color: #666; margin-bottom: 5px; }`,
                isPremium: false,
                isActive: true
            },
            {
                sectionType: 'experience',
                layoutName: 'Card Grid',
                layoutKey: 'experience-cards',
                html: `<div class="exp-cards-grid">
                    {{#each experience}}
                    <div class="exp-card">
                        <div class="head">
                            <span class="role">{{title}}</span>
                            <span class="date">{{date}}</span>
                        </div>
                        <div class="company">{{company}}</div>
                        <p>{{description}}</p>
                    </div>
                    {{/each}}
                </div>`,
                css: `.exp-cards-grid { display: grid; grid-template-columns: 1fr; gap: 15px; }
                      .exp-card { border: 1px solid #eee; padding: 15px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
                      .exp-card .head { display: flex; justify-content: space-between; font-weight: bold; }
                      .exp-card .company { color: #8e3650; font-size: 0.9rem; }`,
                isPremium: true,
                isActive: true
            },
            {
                sectionType: 'experience',
                layoutName: 'Classic Indented',
                layoutKey: 'experience-classic',
                html: `{{#each experience}}
                <div class="exp-classic">
                    <div class="header">
                        <strong>{{company}}</strong> | {{date}}
                    </div>
                    <div class="role">{{title}}</div>
                    <div class="description">{{description}}</div>
                </div>
                {{/each}}`,
                css: `.exp-classic { margin-bottom: 20px; }
                      .exp-classic .header { margin-bottom: 4px; }
                      .exp-classic .role { font-style: italic; margin-bottom: 5px; }`,
                isPremium: false,
                isActive: true
            },
            {
                sectionType: 'experience',
                layoutName: 'Dual Tone Sidebar',
                layoutKey: 'experience-dual-tone',
                html: `<div class="exp-dual">
                    {{#each experience}}
                    <div class="exp-block">
                        <div class="side-accent"></div>
                        <div class="content">
                            <div class="row">
                                <h3>{{title}}</h3>
                                <span class="badge">{{date}}</span>
                            </div>
                            <div class="org">{{company}}</div>
                            <p>{{description}}</p>
                        </div>
                    </div>
                    {{/each}}
                </div>`,
                css: `.exp-block { display: flex; margin-bottom: 25px; }
                      .exp-block .side-accent { width: 4px; background: #8e3650; margin-right: 15px; }
                      .exp-block .row { display: flex; justify-content: space-between; align-items: center; }
                      .exp-block h3 { margin: 0; font-size: 1.15rem; }
                      .exp-block .badge { font-size: 0.75rem; background: #fef2f2; color: #8e3650; padding: 2px 8px; border-radius: 12px; }`,
                isPremium: true,
                isActive: true
            },
            {
                sectionType: 'experience',
                layoutName: 'Left Border Minimal',
                layoutKey: 'experience-border-min',
                html: `<div class="exp-border-min">
                    {{#each experience}}
                    <div class="item">
                        <span class="year">{{date}}</span>
                        <div class="v-line"></div>
                        <div class="info">
                            <strong>{{title}}</strong> @ {{company}}
                            <p>{{description}}</p>
                        </div>
                    </div>
                    {{/each}}
                </div>`,
                css: `.exp-border-min .item { display: flex; gap: 15px; margin-bottom: 10px; }
                      .exp-border-min .year { width: 90px; text-align: right; font-size: 11px; opacity: 0.7; }
                      .exp-border-min .v-line { width: 1px; background: #ddd; position: relative; }
                      .exp-border-min .v-line::after { content: ''; position: absolute; top: 5px; left: -2px; width: 5px; height: 5px; background: #8e3650; border-radius: 50%; }`,
                isPremium: true,
                isActive: true
            },

            // EDUCATION
            {
                sectionType: 'education',
                layoutName: 'Simple List',
                layoutKey: 'education-simple',
                html: `<div class="edu-list">
                    {{#each education}}
                    <div class="edu-item">
                        <strong>{{degree}}</strong> - {{institution}} ({{year}})
                    </div>
                    {{/each}}
                </div>`,
                css: `.edu-item { margin-bottom: 8px; font-size: 1rem; }`,
                isPremium: false,
                isActive: true
            },
            {
                sectionType: 'education',
                layoutName: 'Detail Block',
                layoutKey: 'education-detailed',
                html: `<div class="edu-detailed">
                    {{#each education}}
                    <div class="edu-block">
                        <div class="row">
                            <h3>{{institution}}</h3>
                            <span class="year">{{year}}</span>
                        </div>
                        <div class="degree">{{degree}}</div>
                        <div class="details">{{details}}</div>
                    </div>
                    {{/each}}
                </div>`,
                css: `.edu-block { margin-bottom: 1.5rem; }
                      .edu-block .row { display: flex; justify-content: space-between; }
                      .edu-block h3 { margin: 0; font-size: 1.1rem; color: #333; }
                      .edu-block .degree { font-style: italic; color: #8e3650; }
                      .edu-block .details { font-size: 0.9rem; color: #777; margin-top: 5px; }`,
                isPremium: true,
                isActive: true
            },
            {
                sectionType: 'education',
                layoutName: 'Compact Grid',
                layoutKey: 'education-grid',
                html: `<div class="edu-grid">
                    {{#each education}}
                    <div class="grid-item">
                        <div class="circle">{{year}}</div>
                        <div class="info">
                            <strong>{{degree}}</strong>
                            <p>{{institution}}</p>
                        </div>
                    </div>
                    {{/each}}
                </div>`,
                css: `.edu-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
                      .grid-item { display: flex; align-items: center; gap: 10px; }
                      .grid-item .circle { width: 50px; height: 50px; background: #8e3650; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; flex-shrink: 0; }
                      .grid-item .info p { margin: 0; font-size: 0.85rem; color: #666; }`,
                isPremium: true,
                isActive: true
            },
            {
                sectionType: 'education',
                layoutName: 'ATS Standard',
                layoutKey: 'education-ats',
                html: `<div class="edu-ats">
                    {{#each education}}
                    <div class="edu-entry">
                        <div class="main-line"><strong>{{institution}}</strong>, {{location}}</div>
                        <div class="sub-line">{{degree}} <span class="right">{{year}}</span></div>
                    </div>
                    {{/each}}
                </div>`,
                css: `.edu-entry { margin-bottom: 12px; }
                      .edu-entry .sub-line { display: flex; justify-content: space-between; font-style: italic; }`,
                isPremium: false,
                isActive: true
            },
            {
                sectionType: 'education',
                layoutName: 'Visual Timeline',
                layoutKey: 'education-timeline',
                html: `<div class="edu-timeline">
                    {{#each education}}
                    <div class="t-node">
                        <div class="dot"></div>
                        <div class="t-content">
                            <span class="t-year">{{year}}</span>
                            <h4>{{degree}}</h4>
                            <p>{{institution}}</p>
                        </div>
                    </div>
                    {{/each}}
                </div>`,
                css: `.edu-timeline { padding-left: 20px; border-left: 1px dashed #ccc; }
                      .t-node { position: relative; margin-bottom: 20px; }
                      .t-node .dot { position: absolute; left: -25px; top: 0; width: 9px; height: 9px; background: #333; border-radius: 50%; }
                      .t-node h4 { margin: 0; font-size: 1rem; }`,
                isPremium: true,
                isActive: true
            },

            // SKILLS
            {
                sectionType: 'skills',
                layoutName: 'Pill Tags',
                layoutKey: 'skills-pills',
                html: `<div class="skills-pills">
                    {{#each skills}}
                    <span class="pill-tag">{{this}}</span>
                    {{/each}}
                </div>`,
                css: `.skills-pills { display: flex; flex-wrap: wrap; gap: 8px; }
                      .pill-tag { background: #f1f1f1; padding: 4px 12px; border-radius: 20px; font-size: 0.9rem; color: #333; }`,
                isPremium: false,
                isActive: true
            },
            {
                sectionType: 'skills',
                layoutName: 'Progress Bars',
                layoutKey: 'skills-progress',
                html: `<div class="skills-progress">
                    {{#each skills}}
                    <div class="progress-item">
                        <div class="label">{{name}}</div>
                        <div class="bar-bg"><div class="bar-fill" style="width:{{level}}%"></div></div>
                    </div>
                    {{/each}}
                </div>`,
                css: `.progress-item { margin-bottom: 10px; }
                      .progress-item .label { font-size: 0.85rem; margin-bottom: 3px; }
                      .bar-bg { height: 6px; background: #eee; border-radius: 3px; overflow: hidden; }
                      .bar-fill { height: 100%; background: #8e3650; }`,
                isPremium: true,
                isActive: true
            },
            {
                sectionType: 'skills',
                layoutName: 'Grid Column',
                layoutKey: 'skills-grid',
                html: `<div class="skills-grid">
                    {{#each skills}}
                    <div class="skill-li">&bull; {{this}}</div>
                    {{/each}}
                </div>`,
                css: `.skills-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 5px; }
                      .skill-li { font-size: 0.9rem; }`,
                isPremium: false,
                isActive: true
            },
            {
                sectionType: 'skills',
                layoutName: 'Icon List',
                layoutKey: 'skills-icons',
                html: `<div class="skills-icons">
                    {{#each skills}}
                    <div class="skill-icon-item"><i class="bi bi-star-fill"></i> {{this}}</div>
                    {{/each}}
                </div>`,
                css: `.skills-icons { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
                      .skill-icon-item i { color: #8e3650; margin-right: 5px; font-size: 0.8rem; }`,
                isPremium: true,
                isActive: true
            },
            {
                sectionType: 'skills',
                layoutName: 'Bubble Style',
                layoutKey: 'skills-bubble',
                html: `<div class="skills-bubble">
                    {{#each skills}}
                    <span class="bubble">{{this}}</span>
                    {{/each}}
                </div>`,
                css: `.skills-bubble .bubble { display: inline-block; border: 1px solid #8e3650; color: #8e3650; padding: 3px 10px; border-radius: 4px; margin: 3px; font-size: 12px; }`,
                isPremium: true,
                isActive: true
            },

            // PROJECTS
            {
                sectionType: 'projects',
                layoutName: 'Link Header',
                layoutKey: 'projects-links',
                html: `<div class="projects-list">
                    {{#each projects}}
                    <div class="project-item">
                        <div class="header">
                            <strong>{{name}}</strong> | <a href="{{link}}">{{link}}</a>
                        </div>
                        <p>{{description}}</p>
                    </div>
                    {{/each}}
                </div>`,
                css: `.project-item { margin-bottom: 1.5rem; }
                      .project-item a { color: #8e3650; text-decoration: none; font-size: 0.9rem; }`,
                isPremium: false,
                isActive: true
            },
            {
                sectionType: 'projects',
                layoutName: 'Featured Card',
                layoutKey: 'projects-featured',
                html: `<div class="projects-featured">
                    {{#each projects}}
                    <div class="feature-card">
                        <h3>{{name}}</h3>
                        <div class="tech-stack">{{tech}}</div>
                        <p>{{description}}</p>
                    </div>
                    {{/each}}
                </div>`,
                css: `.feature-card { background: #fff; border: 1px solid #ddd; padding: 20px; border-radius: 12px; margin-bottom: 20px; }
                      .feature-card h3 { margin: 0 0 10px 0; color: #333; }
                      .tech-stack { font-size: 0.8rem; color: #8e3650; font-weight: bold; margin-bottom: 10px; text-transform: uppercase; }`,
                isPremium: true,
                isActive: true
            },
            {
                sectionType: 'projects',
                layoutName: 'Side Description',
                layoutKey: 'projects-side',
                html: `{{#each projects}}
                <div class="project-side">
                    <div class="title-column">
                        <h4>{{name}}</h4>
                        <span>{{tech}}</span>
                    </div>
                    <div class="desc-column">
                        {{description}}
                    </div>
                </div>
                {{/each}}`,
                css: `.project-side { display: grid; grid-template-columns: 180px 1fr; gap: 30px; margin-bottom: 25px; }
                      .project-side h4 { margin: 0; }
                      .project-side span { font-size: 11px; color: #999; }`,
                isPremium: true,
                isActive: true
            },
            {
                sectionType: 'projects',
                layoutName: 'Bullet Summary',
                layoutKey: 'projects-bullet',
                html: `<div class="project-bullets">
                    {{#each projects}}
                    <div class="p-bullet">
                        <strong>{{name}}</strong> &mdash; {{description}}
                    </div>
                    {{/each}}
                </div>`,
                css: `.p-bullet { margin-bottom: 10px; line-height: 1.4; }`,
                isPremium: false,
                isActive: true
            },
            {
                sectionType: 'projects',
                layoutName: 'Banner Display',
                layoutKey: 'projects-banner',
                html: `<div class="projects-banner">
                    {{#each projects}}
                    <div class="banner">
                        <div class="overlay">
                            <h4>{{name}}</h4>
                            <p>{{tech}}</p>
                        </div>
                    </div>
                    {{/each}}
                </div>`,
                css: `.projects-banner .banner { height: 80px; background: #8e3650; color: #fff; border-radius: 8px; margin-bottom: 10px; padding: 15px; position: relative; }
                      .projects-banner h4 { margin: 0; }`,
                isPremium: true,
                isActive: true
            }
        ];

        let createdCount = 0;
        for (const layoutData of layouts) {
            await SectionLayout.create(layoutData);
            createdCount++;
        }

        console.log(`✅ Successfully seeded ${createdCount} section layouts.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding layouts:', error);
        process.exit(1);
    }
}
