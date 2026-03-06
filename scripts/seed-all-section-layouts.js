/**
 * Seed Script: Creates 5+ layouts per section type with real HTML/CSS
 * Run: node scripts/seed-all-section-layouts.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const SectionLayout = require('../src/models/SectionLayout.model');

const PREVIEW_DATA = {
    header: { name: 'Alex Johnson', title: 'Software Engineer', email: 'alex@email.com', phone: '+1 234 567 8900', location: 'New York, USA', linkedin: 'linkedin.com/in/alexjohnson', website: 'alexjohnson.dev' },
    summary: { text: 'Detail-oriented software engineer with 5+ years of experience building scalable web applications. Passionate about creating efficient, maintainable code and leading cross-functional teams.' },
    skills: { skills: ['JavaScript', 'Angular', 'NodeJS', 'React', 'Docker', 'Python', 'AWS', 'TypeScript'] },
    experience: { items: [{ company: 'Tech Innovations Inc.', role: 'Senior Software Engineer', startDate: 'Jan 2020', endDate: 'Present', description: 'Led development of microservices architecture serving 1M+ users.' }, { company: 'Digital Solutions LLC', role: 'Full Stack Developer', startDate: 'Jun 2018', endDate: 'Dec 2019', description: 'Developed and maintained web applications using Angular and Node.js.' }] },
    education: { items: [{ degree: 'B.Sc. Computer Science', institute: 'University of Technology', year: '2016', location: 'Boston, USA' }] },
    projects: { items: [{ name: 'E-Commerce Platform', description: 'Built a full-stack e-commerce platform with payment integration.', link: 'github.com/alex/ecommerce' }] },
    languages: { items: [{ language: 'English', proficiency: 'Native' }, { language: 'Spanish', proficiency: 'Intermediate' }, { language: 'French', proficiency: 'Basic' }] },
    certifications: { items: [{ name: 'AWS Solutions Architect', issuer: 'Amazon', date: '2022' }] },
    awards: { items: [{ name: 'Employee of the Year', issuer: 'Tech Innovations', year: '2022' }] },
    interests: { items: ['Photography', 'Hiking', 'Open Source', 'Reading', 'Travel'] },
    references: { items: [{ name: 'Sarah Williams', position: 'Engineering Manager', company: 'Tech Innovations', email: 'sarah@tech.com', phone: '+1 234 567 8901' }] }
};

// ── HEADER LAYOUTS ──────────────────────────────────────────
const headerLayouts = [
    {
        layoutName: 'Classic Header', layoutKey: 'header-classic',
        html: `<div class="sl-header-classic"><h1 class="sl-name">{{name}}</h1><p class="sl-title">{{title}}</p><div class="sl-contact"><span>{{email}}</span><span>{{phone}}</span><span>{{location}}</span></div></div>`,
        css: `.sl-header-classic{text-align:center;padding:24px 0;border-bottom:2px solid #2c3e50}.sl-header-classic .sl-name{font-size:28px;font-weight:700;color:#2c3e50;margin:0}.sl-header-classic .sl-title{font-size:16px;color:#7f8c8d;margin:4px 0 12px}.sl-header-classic .sl-contact{display:flex;justify-content:center;gap:20px;font-size:13px;color:#555}`
    },
    {
        layoutName: 'Centered Header', layoutKey: 'header-centered',
        html: `<div class="sl-header-centered"><h1>{{name}}</h1><h3>{{title}}</h3><div class="contact-row"><span><i class="bi bi-envelope"></i> {{email}}</span><span><i class="bi bi-phone"></i> {{phone}}</span><span><i class="bi bi-geo-alt"></i> {{location}}</span></div></div>`,
        css: `.sl-header-centered{text-align:center;padding:30px 20px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;border-radius:0 0 16px 16px}.sl-header-centered h1{font-size:32px;margin:0;font-weight:800}.sl-header-centered h3{font-size:15px;opacity:.85;margin:6px 0 16px;font-weight:400}.sl-header-centered .contact-row{display:flex;justify-content:center;gap:18px;font-size:12px;opacity:.9}`
    },
    {
        layoutName: 'Modern Profile Header', layoutKey: 'header-modern-profile',
        html: `<div class="sl-header-modern"><div class="sl-left"><h1>{{name}}</h1><p class="role">{{title}}</p></div><div class="sl-right"><div class="info-item">{{email}}</div><div class="info-item">{{phone}}</div><div class="info-item">{{location}}</div></div></div>`,
        css: `.sl-header-modern{display:flex;justify-content:space-between;align-items:center;padding:24px;border-left:4px solid #3498db}.sl-header-modern .sl-left h1{margin:0;font-size:26px;color:#2c3e50}.sl-header-modern .role{color:#3498db;font-size:14px;margin:4px 0 0}.sl-header-modern .sl-right{text-align:right;font-size:13px;color:#555}.sl-header-modern .info-item{margin:3px 0}`
    },
    {
        layoutName: 'Split Header', layoutKey: 'header-split',
        html: `<div class="sl-header-split"><div class="name-block"><h1>{{name}}</h1><span class="title-tag">{{title}}</span></div><div class="divider"></div><div class="contact-block"><p>{{email}}</p><p>{{phone}}</p><p>{{location}}</p></div></div>`,
        css: `.sl-header-split{display:grid;grid-template-columns:1fr auto 1fr;gap:20px;align-items:center;padding:20px}.sl-header-split h1{margin:0;font-size:24px;color:#1a1a2e}.sl-header-split .title-tag{display:inline-block;background:#e8f4fd;color:#2980b9;padding:4px 12px;border-radius:20px;font-size:12px;margin-top:6px}.sl-header-split .divider{width:2px;height:60px;background:#e0e0e0}.sl-header-split .contact-block{font-size:13px;color:#555}.sl-header-split .contact-block p{margin:4px 0}`
    },
    {
        layoutName: 'Minimal Header', layoutKey: 'header-minimal',
        html: `<div class="sl-header-minimal"><h1>{{name}}</h1><p class="subtitle">{{title}}</p><div class="contact-line">{{email}} · {{phone}} · {{location}}</div></div>`,
        css: `.sl-header-minimal{padding:16px 0;border-bottom:1px solid #eee}.sl-header-minimal h1{font-size:22px;margin:0;font-weight:600;color:#333}.sl-header-minimal .subtitle{font-size:14px;color:#888;margin:2px 0 8px}.sl-header-minimal .contact-line{font-size:12px;color:#666}`
    }
];

// ── SUMMARY LAYOUTS ─────────────────────────────────────────
const summaryLayouts = [
    {
        layoutName: 'Paragraph Style', layoutKey: 'summary-paragraph',
        html: `<div class="sl-summary-para"><h3 class="section-title">Professional Summary</h3><p>{{text}}</p></div>`,
        css: `.sl-summary-para{padding:12px 0}.sl-summary-para .section-title{font-size:16px;font-weight:700;color:#2c3e50;border-bottom:2px solid #3498db;padding-bottom:6px;margin-bottom:10px}.sl-summary-para p{font-size:13px;line-height:1.6;color:#444;margin:0}`
    },
    {
        layoutName: 'Card Style', layoutKey: 'summary-card',
        html: `<div class="sl-summary-card"><h3>Summary</h3><div class="card-body"><p>{{text}}</p></div></div>`,
        css: `.sl-summary-card{padding:12px 0}.sl-summary-card h3{font-size:15px;font-weight:700;color:#2c3e50;margin:0 0 8px}.sl-summary-card .card-body{background:#f8f9fa;padding:16px;border-radius:8px;border-left:3px solid #3498db}.sl-summary-card p{margin:0;font-size:13px;line-height:1.6;color:#555}`
    },
    {
        layoutName: 'Highlight Box', layoutKey: 'summary-highlight',
        html: `<div class="sl-summary-highlight"><div class="highlight-bar"></div><div class="content"><h3>About Me</h3><p>{{text}}</p></div></div>`,
        css: `.sl-summary-highlight{display:flex;gap:12px;padding:12px 0}.sl-summary-highlight .highlight-bar{width:4px;background:linear-gradient(to bottom,#667eea,#764ba2);border-radius:2px;flex-shrink:0}.sl-summary-highlight h3{margin:0 0 6px;font-size:15px;color:#333}.sl-summary-highlight p{margin:0;font-size:13px;line-height:1.6;color:#555}`
    },
    {
        layoutName: 'Divider Layout', layoutKey: 'summary-divider',
        html: `<div class="sl-summary-divider"><h3>Profile</h3><hr/><p>{{text}}</p></div>`,
        css: `.sl-summary-divider{padding:12px 0}.sl-summary-divider h3{font-size:16px;text-transform:uppercase;letter-spacing:2px;color:#2c3e50;margin:0}.sl-summary-divider hr{border:none;height:1px;background:#ddd;margin:8px 0}.sl-summary-divider p{font-size:13px;line-height:1.7;color:#555;margin:0}`
    },
    {
        layoutName: 'Modern Block', layoutKey: 'summary-modern',
        html: `<div class="sl-summary-modern"><div class="icon-col"><i class="bi bi-person-lines-fill"></i></div><div class="text-col"><h3>Professional Summary</h3><p>{{text}}</p></div></div>`,
        css: `.sl-summary-modern{display:flex;gap:16px;padding:16px;background:#fafbfc;border-radius:10px}.sl-summary-modern .icon-col{font-size:24px;color:#3498db;padding-top:2px}.sl-summary-modern .text-col h3{margin:0 0 6px;font-size:14px;font-weight:700;color:#2c3e50}.sl-summary-modern p{margin:0;font-size:13px;line-height:1.6;color:#555}`
    }
];

// ── EXPERIENCE LAYOUTS ──────────────────────────────────────
const experienceLayouts = [
    {
        layoutName: 'Timeline Layout', layoutKey: 'experience-timeline',
        html: `<div class="sl-exp-timeline"><h3 class="sec-title">Work Experience</h3><div class="timeline-items">{{#each items}}<div class="timeline-item"><div class="dot"></div><div class="content"><h4>{{role}}</h4><span class="company">{{company}}</span><span class="date">{{startDate}} – {{endDate}}</span><p>{{description}}</p></div></div>{{/each}}</div></div>`,
        css: `.sl-exp-timeline .sec-title{font-size:16px;font-weight:700;color:#2c3e50;border-bottom:2px solid #3498db;padding-bottom:6px;margin-bottom:12px}.sl-exp-timeline .timeline-items{border-left:2px solid #e0e0e0;padding-left:20px}.sl-exp-timeline .timeline-item{position:relative;margin-bottom:16px}.sl-exp-timeline .dot{width:10px;height:10px;background:#3498db;border-radius:50%;position:absolute;left:-26px;top:4px}.sl-exp-timeline h4{margin:0;font-size:14px;color:#333}.sl-exp-timeline .company{font-size:13px;color:#3498db;font-weight:500}.sl-exp-timeline .date{font-size:11px;color:#999;margin-left:8px}.sl-exp-timeline p{font-size:12px;color:#555;line-height:1.5;margin:4px 0 0}`
    },
    {
        layoutName: 'Left Border Layout', layoutKey: 'experience-left-border',
        html: `<div class="sl-exp-border"><h3>Experience</h3>{{#each items}}<div class="exp-item"><div class="meta"><span class="dates">{{startDate}} – {{endDate}}</span></div><div class="details"><h4>{{role}}</h4><p class="comp">{{company}}</p><p class="desc">{{description}}</p></div></div>{{/each}}</div>`,
        css: `.sl-exp-border h3{font-size:16px;font-weight:700;color:#2c3e50;margin:0 0 12px}.sl-exp-border .exp-item{display:flex;gap:16px;border-left:3px solid #667eea;padding:12px 16px;margin-bottom:10px;background:#fafbfc;border-radius:0 8px 8px 0}.sl-exp-border .meta{min-width:100px;font-size:11px;color:#888}.sl-exp-border h4{margin:0;font-size:14px;color:#333}.sl-exp-border .comp{font-size:13px;color:#667eea;margin:2px 0}.sl-exp-border .desc{font-size:12px;color:#555;line-height:1.5;margin:4px 0 0}`
    },
    {
        layoutName: 'Card Layout', layoutKey: 'experience-card',
        html: `<div class="sl-exp-card"><h3>Work Experience</h3>{{#each items}}<div class="exp-card"><h4>{{role}}</h4><div class="card-meta"><span>{{company}}</span><span>{{startDate}} – {{endDate}}</span></div><p>{{description}}</p></div>{{/each}}</div>`,
        css: `.sl-exp-card h3{font-size:16px;font-weight:700;color:#2c3e50;margin:0 0 12px}.sl-exp-card .exp-card{background:#fff;border:1px solid #eee;border-radius:10px;padding:16px;margin-bottom:10px;box-shadow:0 2px 8px rgba(0,0,0,.04)}.sl-exp-card h4{margin:0;font-size:14px;color:#333}.sl-exp-card .card-meta{display:flex;justify-content:space-between;font-size:12px;color:#888;margin:4px 0 8px}.sl-exp-card p{font-size:12px;color:#555;margin:0;line-height:1.5}`
    },
    {
        layoutName: 'Simple List', layoutKey: 'experience-simple',
        html: `<div class="sl-exp-simple"><h3>Experience</h3>{{#each items}}<div class="exp-row"><div class="row-header"><h4>{{role}} <span class="at">at</span> {{company}}</h4><span class="date">{{startDate}} – {{endDate}}</span></div><p>{{description}}</p></div>{{/each}}</div>`,
        css: `.sl-exp-simple h3{font-size:16px;text-transform:uppercase;letter-spacing:1.5px;color:#2c3e50;border-bottom:1px solid #ddd;padding-bottom:6px;margin:0 0 12px}.sl-exp-simple .exp-row{margin-bottom:14px}.sl-exp-simple .row-header{display:flex;justify-content:space-between;align-items:baseline}.sl-exp-simple h4{margin:0;font-size:14px;color:#333}.sl-exp-simple .at{color:#999;font-weight:400}.sl-exp-simple .date{font-size:11px;color:#888}.sl-exp-simple p{font-size:12px;color:#555;margin:4px 0 0;line-height:1.5}`
    },
    {
        layoutName: 'Modern Two Column', layoutKey: 'experience-two-col',
        html: `<div class="sl-exp-twocol"><h3>Professional Experience</h3>{{#each items}}<div class="exp-grid"><div class="left-col"><span class="period">{{startDate}}<br/>{{endDate}}</span></div><div class="right-col"><h4>{{role}}</h4><p class="company">{{company}}</p><p class="desc">{{description}}</p></div></div>{{/each}}</div>`,
        css: `.sl-exp-twocol h3{font-size:16px;font-weight:700;color:#2c3e50;margin:0 0 12px}.sl-exp-twocol .exp-grid{display:grid;grid-template-columns:80px 1fr;gap:16px;margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid #f0f0f0}.sl-exp-twocol .left-col{text-align:right}.sl-exp-twocol .period{font-size:11px;color:#888;line-height:1.4}.sl-exp-twocol h4{margin:0;font-size:14px;color:#333}.sl-exp-twocol .company{font-size:13px;color:#3498db;margin:2px 0}.sl-exp-twocol .desc{font-size:12px;color:#555;margin:4px 0 0;line-height:1.5}`
    }
];

// ── SKILLS LAYOUTS ──────────────────────────────────────────
const skillsLayouts = [
    {
        layoutName: 'Tag List', layoutKey: 'skills-tags',
        html: `<div class="sl-skills-tags"><h3>Skills</h3><div class="tags">{{#each skills}}<span class="tag">{{this}}</span>{{/each}}</div></div>`,
        css: `.sl-skills-tags h3{font-size:16px;font-weight:700;color:#2c3e50;margin:0 0 10px}.sl-skills-tags .tags{display:flex;flex-wrap:wrap;gap:6px}.sl-skills-tags .tag{background:#e8f4fd;color:#2980b9;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:500}`
    },
    {
        layoutName: 'Horizontal Progress Bars', layoutKey: 'skills-bars',
        html: `<div class="sl-skills-bars"><h3>Skills</h3>{{#each skills}}<div class="skill-bar"><span class="label">{{this}}</span><div class="bar"><div class="fill" style="width:85%"></div></div></div>{{/each}}</div>`,
        css: `.sl-skills-bars h3{font-size:16px;font-weight:700;color:#2c3e50;margin:0 0 10px}.sl-skills-bars .skill-bar{margin-bottom:8px}.sl-skills-bars .label{font-size:12px;color:#333;margin-bottom:3px;display:block}.sl-skills-bars .bar{height:6px;background:#eee;border-radius:3px;overflow:hidden}.sl-skills-bars .fill{height:100%;background:linear-gradient(90deg,#3498db,#667eea);border-radius:3px}`
    },
    {
        layoutName: 'Bullet List', layoutKey: 'skills-bullets',
        html: `<div class="sl-skills-bullets"><h3>Skills</h3><ul>{{#each skills}}<li>{{this}}</li>{{/each}}</ul></div>`,
        css: `.sl-skills-bullets h3{font-size:16px;font-weight:700;color:#2c3e50;margin:0 0 10px}.sl-skills-bullets ul{columns:2;list-style:none;padding:0;margin:0}.sl-skills-bullets li{font-size:13px;color:#444;padding:3px 0 3px 16px;position:relative}.sl-skills-bullets li::before{content:'▸';position:absolute;left:0;color:#3498db}`
    },
    {
        layoutName: 'Grid Layout', layoutKey: 'skills-grid',
        html: `<div class="sl-skills-grid"><h3>Skills</h3><div class="grid">{{#each skills}}<div class="cell">{{this}}</div>{{/each}}</div></div>`,
        css: `.sl-skills-grid h3{font-size:16px;font-weight:700;color:#2c3e50;margin:0 0 10px}.sl-skills-grid .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.sl-skills-grid .cell{background:#f8f9fa;text-align:center;padding:8px;border-radius:6px;font-size:12px;color:#333;border:1px solid #eee}`
    },
    {
        layoutName: 'Modern Bubble', layoutKey: 'skills-bubble',
        html: `<div class="sl-skills-bubble"><h3>Skills</h3><div class="bubbles">{{#each skills}}<span class="bubble">{{this}}</span>{{/each}}</div></div>`,
        css: `.sl-skills-bubble h3{font-size:16px;font-weight:700;color:#2c3e50;margin:0 0 10px}.sl-skills-bubble .bubbles{display:flex;flex-wrap:wrap;gap:8px}.sl-skills-bubble .bubble{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:6px 16px;border-radius:24px;font-size:12px;font-weight:500;box-shadow:0 2px 6px rgba(102,126,234,.3)}`
    }
];

// ── EDUCATION LAYOUTS ───────────────────────────────────────
const educationLayouts = [
    {
        layoutName: 'Timeline', layoutKey: 'education-timeline',
        html: `<div class="sl-edu-timeline"><h3>Education</h3>{{#each items}}<div class="edu-item"><div class="dot"></div><h4>{{degree}}</h4><p class="inst">{{institute}}</p><span class="year">{{year}}</span></div>{{/each}}</div>`,
        css: `.sl-edu-timeline h3{font-size:16px;font-weight:700;color:#2c3e50;margin:0 0 12px}.sl-edu-timeline .edu-item{position:relative;padding-left:20px;margin-bottom:12px;border-left:2px solid #e0e0e0}.sl-edu-timeline .dot{width:8px;height:8px;background:#3498db;border-radius:50%;position:absolute;left:-5px;top:4px}.sl-edu-timeline h4{margin:0;font-size:14px;color:#333}.sl-edu-timeline .inst{font-size:13px;color:#666;margin:2px 0}.sl-edu-timeline .year{font-size:11px;color:#999}`
    },
    {
        layoutName: 'Simple Row', layoutKey: 'education-simple',
        html: `<div class="sl-edu-simple"><h3>Education</h3>{{#each items}}<div class="edu-row"><div><h4>{{degree}}</h4><p>{{institute}}</p></div><span class="year">{{year}}</span></div>{{/each}}</div>`,
        css: `.sl-edu-simple h3{font-size:16px;font-weight:700;color:#2c3e50;border-bottom:2px solid #3498db;padding-bottom:6px;margin:0 0 10px}.sl-edu-simple .edu-row{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px}.sl-edu-simple h4{margin:0;font-size:14px;color:#333}.sl-edu-simple p{margin:2px 0 0;font-size:13px;color:#666}.sl-edu-simple .year{font-size:12px;color:#888;white-space:nowrap}`
    },
    {
        layoutName: 'Card Layout', layoutKey: 'education-card',
        html: `<div class="sl-edu-card"><h3>Education</h3>{{#each items}}<div class="edu-card"><h4>{{degree}}</h4><p class="inst">{{institute}}</p><span class="yr">{{year}}</span></div>{{/each}}</div>`,
        css: `.sl-edu-card h3{font-size:16px;font-weight:700;color:#2c3e50;margin:0 0 10px}.sl-edu-card .edu-card{background:#f8f9fa;padding:14px;border-radius:8px;margin-bottom:8px;border-left:3px solid #667eea}.sl-edu-card h4{margin:0;font-size:14px;color:#333}.sl-edu-card .inst{font-size:13px;color:#666;margin:2px 0}.sl-edu-card .yr{font-size:11px;color:#999}`
    },
    {
        layoutName: 'Compact List', layoutKey: 'education-compact',
        html: `<div class="sl-edu-compact"><h3>Education</h3>{{#each items}}<div class="edu-line"><strong>{{degree}}</strong> — {{institute}} ({{year}})</div>{{/each}}</div>`,
        css: `.sl-edu-compact h3{font-size:16px;font-weight:700;color:#2c3e50;margin:0 0 8px}.sl-edu-compact .edu-line{font-size:13px;color:#444;padding:4px 0;border-bottom:1px solid #f0f0f0}.sl-edu-compact strong{color:#333}`
    },
    {
        layoutName: 'Modern Highlight', layoutKey: 'education-modern',
        html: `<div class="sl-edu-modern"><h3>Education</h3>{{#each items}}<div class="edu-block"><div class="year-badge">{{year}}</div><div class="info"><h4>{{degree}}</h4><p>{{institute}}</p></div></div>{{/each}}</div>`,
        css: `.sl-edu-modern h3{font-size:16px;font-weight:700;color:#2c3e50;margin:0 0 12px}.sl-edu-modern .edu-block{display:flex;gap:12px;align-items:flex-start;margin-bottom:10px}.sl-edu-modern .year-badge{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:6px 12px;border-radius:6px;font-size:12px;font-weight:600;white-space:nowrap}.sl-edu-modern h4{margin:0;font-size:14px;color:#333}.sl-edu-modern p{margin:2px 0 0;font-size:13px;color:#666}`
    }
];

// ── PROJECTS / LANGUAGES / CERTS / AWARDS / INTERESTS / REFERENCES ──
const projectsLayouts = [
    { layoutName: 'Card Grid', layoutKey: 'projects-card-grid', html: `<div class="sl-proj-grid"><h3>Projects</h3>{{#each items}}<div class="proj-card"><h4>{{name}}</h4><p>{{description}}</p><a href="{{link}}">View →</a></div>{{/each}}</div>`, css: `.sl-proj-grid h3{font-size:16px;font-weight:700;color:#2c3e50;margin:0 0 10px}.sl-proj-grid .proj-card{background:#f8f9fa;padding:14px;border-radius:8px;margin-bottom:8px;border:1px solid #eee}.sl-proj-grid h4{margin:0;font-size:14px;color:#333}.sl-proj-grid p{font-size:12px;color:#555;margin:4px 0}.sl-proj-grid a{font-size:12px;color:#3498db;text-decoration:none}` },
    { layoutName: 'Simple List', layoutKey: 'projects-simple', html: `<div class="sl-proj-simple"><h3>Projects</h3>{{#each items}}<div class="proj-item"><h4>{{name}}</h4><p>{{description}}</p></div>{{/each}}</div>`, css: `.sl-proj-simple h3{font-size:16px;font-weight:700;color:#2c3e50;border-bottom:2px solid #3498db;padding-bottom:6px;margin:0 0 10px}.sl-proj-simple .proj-item{margin-bottom:10px}.sl-proj-simple h4{margin:0;font-size:14px;color:#333}.sl-proj-simple p{font-size:12px;color:#555;margin:4px 0 0}` },
    { layoutName: 'Timeline', layoutKey: 'projects-timeline', html: `<div class="sl-proj-tl"><h3>Projects</h3><div class="tl">{{#each items}}<div class="tl-item"><div class="dot"></div><h4>{{name}}</h4><p>{{description}}</p></div>{{/each}}</div></div>`, css: `.sl-proj-tl h3{font-size:16px;font-weight:700;color:#2c3e50;margin:0 0 10px}.sl-proj-tl .tl{border-left:2px solid #eee;padding-left:16px}.sl-proj-tl .tl-item{position:relative;margin-bottom:12px}.sl-proj-tl .dot{width:8px;height:8px;background:#667eea;border-radius:50%;position:absolute;left:-21px;top:5px}.sl-proj-tl h4{margin:0;font-size:14px;color:#333}.sl-proj-tl p{font-size:12px;color:#555;margin:4px 0 0}` },
    { layoutName: 'Two Column', layoutKey: 'projects-twocol', html: `<div class="sl-proj-2c"><h3>Projects</h3><div class="grid">{{#each items}}<div class="item"><h4>{{name}}</h4><p>{{description}}</p></div>{{/each}}</div></div>`, css: `.sl-proj-2c h3{font-size:16px;font-weight:700;color:#2c3e50;margin:0 0 10px}.sl-proj-2c .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.sl-proj-2c .item{background:#fafbfc;padding:12px;border-radius:6px;border:1px solid #eee}.sl-proj-2c h4{margin:0;font-size:13px;color:#333}.sl-proj-2c p{font-size:12px;color:#555;margin:4px 0 0}` },
    { layoutName: 'Accent Cards', layoutKey: 'projects-accent', html: `<div class="sl-proj-acc"><h3>Projects</h3>{{#each items}}<div class="card"><h4>{{name}}</h4><p>{{description}}</p></div>{{/each}}</div>`, css: `.sl-proj-acc h3{font-size:16px;font-weight:700;color:#2c3e50;margin:0 0 10px}.sl-proj-acc .card{padding:12px;border-left:3px solid #764ba2;background:#faf8ff;border-radius:0 6px 6px 0;margin-bottom:8px}.sl-proj-acc h4{margin:0;font-size:14px;color:#333}.sl-proj-acc p{font-size:12px;color:#555;margin:4px 0 0}` }
];

const languagesLayouts = [
    { layoutName: 'Inline Tags', layoutKey: 'lang-tags', html: `<div class="sl-lang-tags"><h3>Languages</h3><div class="tags">{{#each items}}<span class="tag">{{language}} <small>({{proficiency}})</small></span>{{/each}}</div></div>`, css: `.sl-lang-tags h3{font-size:16px;font-weight:700;color:#2c3e50;margin:0 0 10px}.sl-lang-tags .tags{display:flex;flex-wrap:wrap;gap:6px}.sl-lang-tags .tag{background:#e8f8f5;color:#1abc9c;padding:5px 14px;border-radius:20px;font-size:12px} .sl-lang-tags small{opacity:.7}` },
    { layoutName: 'Progress Dots', layoutKey: 'lang-dots', html: `<div class="sl-lang-dots"><h3>Languages</h3>{{#each items}}<div class="lang-row"><span class="name">{{language}}</span><span class="level">{{proficiency}}</span></div>{{/each}}</div>`, css: `.sl-lang-dots h3{font-size:16px;font-weight:700;color:#2c3e50;margin:0 0 10px}.sl-lang-dots .lang-row{display:flex;justify-content:space-between;font-size:13px;padding:4px 0;border-bottom:1px solid #f0f0f0}.sl-lang-dots .name{color:#333}.sl-lang-dots .level{color:#888;font-size:12px}` },
    { layoutName: 'Bar Chart', layoutKey: 'lang-bars', html: `<div class="sl-lang-bars"><h3>Languages</h3>{{#each items}}<div class="lang-bar"><span>{{language}}</span><div class="bar"><div class="fill"></div></div></div>{{/each}}</div>`, css: `.sl-lang-bars h3{font-size:16px;font-weight:700;color:#2c3e50;margin:0 0 10px}.sl-lang-bars .lang-bar{margin-bottom:8px}.sl-lang-bars span{font-size:12px;color:#333}.sl-lang-bars .bar{height:5px;background:#eee;border-radius:3px;margin-top:3px}.sl-lang-bars .fill{height:100%;width:75%;background:#1abc9c;border-radius:3px}` },
    { layoutName: 'Card List', layoutKey: 'lang-cards', html: `<div class="sl-lang-cards"><h3>Languages</h3><div class="grid">{{#each items}}<div class="card"><strong>{{language}}</strong><span>{{proficiency}}</span></div>{{/each}}</div></div>`, css: `.sl-lang-cards h3{font-size:16px;font-weight:700;color:#2c3e50;margin:0 0 10px}.sl-lang-cards .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.sl-lang-cards .card{background:#f8f9fa;padding:10px;border-radius:6px;text-align:center;border:1px solid #eee}.sl-lang-cards strong{display:block;font-size:13px;color:#333}.sl-lang-cards span{font-size:11px;color:#888}` },
    { layoutName: 'Minimal Row', layoutKey: 'lang-minimal', html: `<div class="sl-lang-min"><h3>Languages</h3>{{#each items}}<div class="row">{{language}} — <em>{{proficiency}}</em></div>{{/each}}</div>`, css: `.sl-lang-min h3{font-size:16px;font-weight:700;color:#2c3e50;border-bottom:2px solid #1abc9c;padding-bottom:6px;margin:0 0 10px}.sl-lang-min .row{font-size:13px;color:#444;padding:3px 0}.sl-lang-min em{color:#888;font-style:normal}` }
];

const certsLayouts = [
    { layoutName: 'Badge Style', layoutKey: 'certs-badge', html: `<div class="sl-certs-badge"><h3>Certifications</h3>{{#each items}}<div class="cert"><span class="icon">🏆</span><div><strong>{{name}}</strong><p>{{issuer}} · {{date}}</p></div></div>{{/each}}</div>`, css: `.sl-certs-badge h3{font-size:16px;font-weight:700;color:#2c3e50;margin:0 0 10px}.sl-certs-badge .cert{display:flex;gap:10px;align-items:flex-start;margin-bottom:8px}.sl-certs-badge .icon{font-size:20px}.sl-certs-badge strong{font-size:13px;color:#333}.sl-certs-badge p{font-size:12px;color:#888;margin:2px 0 0}` },
    { layoutName: 'Simple List', layoutKey: 'certs-simple', html: `<div class="sl-certs-simple"><h3>Certifications</h3>{{#each items}}<div class="cert-row"><strong>{{name}}</strong> — {{issuer}} ({{date}})</div>{{/each}}</div>`, css: `.sl-certs-simple h3{font-size:16px;font-weight:700;color:#2c3e50;border-bottom:2px solid #e67e22;padding-bottom:6px;margin:0 0 10px}.sl-certs-simple .cert-row{font-size:13px;color:#444;padding:4px 0;border-bottom:1px solid #f5f5f5}.sl-certs-simple strong{color:#333}` },
    { layoutName: 'Card', layoutKey: 'certs-card', html: `<div class="sl-certs-card"><h3>Certifications</h3>{{#each items}}<div class="card"><h4>{{name}}</h4><p>{{issuer}} · {{date}}</p></div>{{/each}}</div>`, css: `.sl-certs-card h3{font-size:16px;font-weight:700;color:#2c3e50;margin:0 0 10px}.sl-certs-card .card{background:#fff8f0;padding:12px;border-radius:6px;border-left:3px solid #e67e22;margin-bottom:6px}.sl-certs-card h4{margin:0;font-size:13px;color:#333}.sl-certs-card p{margin:2px 0 0;font-size:12px;color:#888}` },
    { layoutName: 'Timeline', layoutKey: 'certs-timeline', html: `<div class="sl-certs-tl"><h3>Certifications</h3><div class="tl">{{#each items}}<div class="item"><span class="date">{{date}}</span><strong>{{name}}</strong><span class="issuer">{{issuer}}</span></div>{{/each}}</div></div>`, css: `.sl-certs-tl h3{font-size:16px;font-weight:700;color:#2c3e50;margin:0 0 10px}.sl-certs-tl .tl{border-left:2px solid #e67e22;padding-left:14px}.sl-certs-tl .item{margin-bottom:10px}.sl-certs-tl .date{font-size:11px;color:#e67e22;display:block}.sl-certs-tl strong{font-size:13px;color:#333;display:block}.sl-certs-tl .issuer{font-size:12px;color:#888}` },
    { layoutName: 'Grid', layoutKey: 'certs-grid', html: `<div class="sl-certs-grid"><h3>Certifications</h3><div class="grid">{{#each items}}<div class="cell"><strong>{{name}}</strong><p>{{issuer}}</p><span>{{date}}</span></div>{{/each}}</div></div>`, css: `.sl-certs-grid h3{font-size:16px;font-weight:700;color:#2c3e50;margin:0 0 10px}.sl-certs-grid .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.sl-certs-grid .cell{background:#fafbfc;padding:10px;border-radius:6px;border:1px solid #eee}.sl-certs-grid strong{font-size:13px;color:#333}.sl-certs-grid p{font-size:12px;color:#666;margin:2px 0}.sl-certs-grid span{font-size:11px;color:#999}` }
];

const awardsLayouts = [
    { layoutName: 'Trophy Style', layoutKey: 'awards-trophy', html: `<div class="sl-awards-trophy"><h3>Awards</h3>{{#each items}}<div class="award"><span class="trophy">🏅</span><div><strong>{{name}}</strong><p>{{issuer}} · {{year}}</p></div></div>{{/each}}</div>`, css: `.sl-awards-trophy h3{font-size:16px;font-weight:700;color:#2c3e50;margin:0 0 10px}.sl-awards-trophy .award{display:flex;gap:10px;margin-bottom:8px}.sl-awards-trophy .trophy{font-size:20px}.sl-awards-trophy strong{font-size:13px;color:#333}.sl-awards-trophy p{font-size:12px;color:#888;margin:2px 0 0}` },
    { layoutName: 'Simple List', layoutKey: 'awards-simple', html: `<div class="sl-awards-simple"><h3>Awards</h3>{{#each items}}<div class="row"><strong>{{name}}</strong> — {{issuer}} ({{year}})</div>{{/each}}</div>`, css: `.sl-awards-simple h3{font-size:16px;font-weight:700;color:#2c3e50;border-bottom:2px solid #f1c40f;padding-bottom:6px;margin:0 0 10px}.sl-awards-simple .row{font-size:13px;color:#444;padding:4px 0}` },
    { layoutName: 'Card', layoutKey: 'awards-card', html: `<div class="sl-awards-card"><h3>Awards</h3>{{#each items}}<div class="card"><h4>{{name}}</h4><p>{{issuer}} · {{year}}</p></div>{{/each}}</div>`, css: `.sl-awards-card h3{font-size:16px;font-weight:700;color:#2c3e50;margin:0 0 10px}.sl-awards-card .card{background:#fffbe6;padding:12px;border-radius:6px;border-left:3px solid #f1c40f;margin-bottom:6px}.sl-awards-card h4{margin:0;font-size:13px;color:#333}.sl-awards-card p{margin:2px 0 0;font-size:12px;color:#888}` },
    { layoutName: 'Highlight', layoutKey: 'awards-highlight', html: `<div class="sl-awards-hl"><h3>Awards & Honors</h3>{{#each items}}<div class="item"><div class="yr">{{year}}</div><div><strong>{{name}}</strong><p>{{issuer}}</p></div></div>{{/each}}</div>`, css: `.sl-awards-hl h3{font-size:16px;font-weight:700;color:#2c3e50;margin:0 0 10px}.sl-awards-hl .item{display:flex;gap:12px;margin-bottom:8px}.sl-awards-hl .yr{background:#f1c40f;color:#fff;padding:4px 10px;border-radius:4px;font-size:12px;font-weight:600;white-space:nowrap;height:fit-content}.sl-awards-hl strong{font-size:13px;color:#333}.sl-awards-hl p{font-size:12px;color:#888;margin:2px 0 0}` },
    { layoutName: 'Minimal', layoutKey: 'awards-minimal', html: `<div class="sl-awards-min"><h3>Awards</h3><ul>{{#each items}}<li><strong>{{name}}</strong> — {{issuer}}, {{year}}</li>{{/each}}</ul></div>`, css: `.sl-awards-min h3{font-size:16px;font-weight:700;color:#2c3e50;margin:0 0 8px}.sl-awards-min ul{list-style:none;padding:0;margin:0}.sl-awards-min li{font-size:13px;color:#444;padding:3px 0 3px 14px;position:relative}.sl-awards-min li::before{content:'★';position:absolute;left:0;color:#f1c40f;font-size:12px}` }
];

const interestsLayouts = [
    { layoutName: 'Tag Cloud', layoutKey: 'interests-tags', html: `<div class="sl-int-tags"><h3>Interests</h3><div class="tags">{{#each items}}<span>{{this}}</span>{{/each}}</div></div>`, css: `.sl-int-tags h3{font-size:16px;font-weight:700;color:#2c3e50;margin:0 0 10px}.sl-int-tags .tags{display:flex;flex-wrap:wrap;gap:6px}.sl-int-tags span{background:#e8f8f5;color:#16a085;padding:5px 14px;border-radius:20px;font-size:12px}` },
    { layoutName: 'Grid Icons', layoutKey: 'interests-grid', html: `<div class="sl-int-grid"><h3>Interests</h3><div class="grid">{{#each items}}<div class="cell">{{this}}</div>{{/each}}</div></div>`, css: `.sl-int-grid h3{font-size:16px;font-weight:700;color:#2c3e50;margin:0 0 10px}.sl-int-grid .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.sl-int-grid .cell{background:#fafbfc;text-align:center;padding:8px;border-radius:6px;font-size:12px;color:#333;border:1px solid #eee}` },
    { layoutName: 'Inline List', layoutKey: 'interests-inline', html: `<div class="sl-int-inline"><h3>Interests</h3><p class="list">{{#each items}}{{this}}{{#unless @last}} · {{/unless}}{{/each}}</p></div>`, css: `.sl-int-inline h3{font-size:16px;font-weight:700;color:#2c3e50;border-bottom:2px solid #16a085;padding-bottom:6px;margin:0 0 10px}.sl-int-inline .list{font-size:13px;color:#555}` },
    { layoutName: 'Bubble', layoutKey: 'interests-bubble', html: `<div class="sl-int-bbl"><h3>Interests</h3><div class="bubbles">{{#each items}}<span>{{this}}</span>{{/each}}</div></div>`, css: `.sl-int-bbl h3{font-size:16px;font-weight:700;color:#2c3e50;margin:0 0 10px}.sl-int-bbl .bubbles{display:flex;flex-wrap:wrap;gap:8px}.sl-int-bbl span{background:linear-gradient(135deg,#00b894,#00cec9);color:#fff;padding:6px 16px;border-radius:24px;font-size:12px;font-weight:500}` },
    { layoutName: 'Bullet List', layoutKey: 'interests-bullets', html: `<div class="sl-int-blt"><h3>Interests</h3><ul>{{#each items}}<li>{{this}}</li>{{/each}}</ul></div>`, css: `.sl-int-blt h3{font-size:16px;font-weight:700;color:#2c3e50;margin:0 0 8px}.sl-int-blt ul{columns:2;list-style:none;padding:0;margin:0}.sl-int-blt li{font-size:13px;color:#444;padding:3px 0 3px 14px;position:relative}.sl-int-blt li::before{content:'♦';position:absolute;left:0;color:#16a085;font-size:10px}` }
];

const referencesLayouts = [
    { layoutName: 'Card Style', layoutKey: 'refs-card', html: `<div class="sl-refs-card"><h3>References</h3>{{#each items}}<div class="ref-card"><h4>{{name}}</h4><p class="pos">{{position}} at {{company}}</p><p class="contact">{{email}} · {{phone}}</p></div>{{/each}}</div>`, css: `.sl-refs-card h3{font-size:16px;font-weight:700;color:#2c3e50;margin:0 0 10px}.sl-refs-card .ref-card{background:#f8f9fa;padding:14px;border-radius:8px;margin-bottom:8px;border:1px solid #eee}.sl-refs-card h4{margin:0;font-size:14px;color:#333}.sl-refs-card .pos{font-size:13px;color:#666;margin:2px 0}.sl-refs-card .contact{font-size:12px;color:#3498db;margin:2px 0}` },
    { layoutName: 'Simple List', layoutKey: 'refs-simple', html: `<div class="sl-refs-simple"><h3>References</h3>{{#each items}}<div class="ref"><strong>{{name}}</strong> — {{position}}, {{company}}<br/><small>{{email}} | {{phone}}</small></div>{{/each}}</div>`, css: `.sl-refs-simple h3{font-size:16px;font-weight:700;color:#2c3e50;border-bottom:2px solid #9b59b6;padding-bottom:6px;margin:0 0 10px}.sl-refs-simple .ref{font-size:13px;color:#444;padding:6px 0;border-bottom:1px solid #f5f5f5}.sl-refs-simple strong{color:#333}.sl-refs-simple small{font-size:12px;color:#888}` },
    { layoutName: 'Grid', layoutKey: 'refs-grid', html: `<div class="sl-refs-grid"><h3>References</h3><div class="grid">{{#each items}}<div class="cell"><h4>{{name}}</h4><p>{{position}}</p><p class="co">{{company}}</p><small>{{email}}</small></div>{{/each}}</div></div>`, css: `.sl-refs-grid h3{font-size:16px;font-weight:700;color:#2c3e50;margin:0 0 10px}.sl-refs-grid .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.sl-refs-grid .cell{background:#fafbfc;padding:12px;border-radius:6px;border:1px solid #eee}.sl-refs-grid h4{margin:0;font-size:13px;color:#333}.sl-refs-grid p{font-size:12px;color:#666;margin:2px 0}.sl-refs-grid .co{color:#9b59b6}.sl-refs-grid small{font-size:11px;color:#888}` },
    { layoutName: 'Accent Border', layoutKey: 'refs-accent', html: `<div class="sl-refs-acc"><h3>References</h3>{{#each items}}<div class="ref"><h4>{{name}}</h4><p>{{position}} · {{company}}</p><p class="ct">{{email}} | {{phone}}</p></div>{{/each}}</div>`, css: `.sl-refs-acc h3{font-size:16px;font-weight:700;color:#2c3e50;margin:0 0 10px}.sl-refs-acc .ref{border-left:3px solid #9b59b6;padding:10px 14px;margin-bottom:8px;background:#faf8ff;border-radius:0 6px 6px 0}.sl-refs-acc h4{margin:0;font-size:14px;color:#333}.sl-refs-acc p{font-size:12px;color:#666;margin:2px 0}.sl-refs-acc .ct{color:#9b59b6}` },
    { layoutName: 'Minimal', layoutKey: 'refs-minimal', html: `<div class="sl-refs-min"><h3>References</h3><p class="note">Available upon request</p>{{#each items}}<div class="ref"><strong>{{name}}</strong>, {{position}}, {{company}} — {{email}}</div>{{/each}}</div>`, css: `.sl-refs-min h3{font-size:16px;font-weight:700;color:#2c3e50;margin:0 0 6px}.sl-refs-min .note{font-size:12px;color:#888;font-style:italic;margin:0 0 8px}.sl-refs-min .ref{font-size:13px;color:#444;padding:3px 0}.sl-refs-min strong{color:#333}` }
];

// Combine all
function buildAllLayouts() {
    const all = [];
    const addSection = (type, layouts, previewKey) => {
        layouts.forEach(l => {
            all.push({
                sectionType: type,
                layoutName: l.layoutName,
                layoutKey: l.layoutKey,
                html: l.html,
                css: l.css,
                category: 'standard',
                isActive: true,
                isPremium: false,
                preview_data: PREVIEW_DATA[previewKey] || {}
            });
        });
    };

    addSection('header', headerLayouts, 'header');
    addSection('summary', summaryLayouts, 'summary');
    addSection('experience', experienceLayouts, 'experience');
    addSection('education', educationLayouts, 'education');
    addSection('skills', skillsLayouts, 'skills');
    addSection('projects', projectsLayouts, 'projects');
    addSection('languages', languagesLayouts, 'languages');
    addSection('certifications', certsLayouts, 'certifications');
    addSection('awards', awardsLayouts, 'awards');
    addSection('interests', interestsLayouts, 'interests');
    addSection('references', referencesLayouts, 'references');

    return all;
}

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const layouts = buildAllLayouts();
        console.log(`Prepared ${layouts.length} layouts for seeding`);

        let inserted = 0, skipped = 0;
        for (const layout of layouts) {
            const exists = await SectionLayout.findOne({ layoutKey: layout.layoutKey });
            if (exists) {
                skipped++;
                continue;
            }
            await SectionLayout.create(layout);
            inserted++;
        }

        console.log(`\nSeed complete: ${inserted} inserted, ${skipped} skipped (already exist)`);
        process.exit(0);
    } catch (err) {
        console.error('Seed error:', err);
        process.exit(1);
    }
}

seed();
