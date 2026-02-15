require('dotenv').config();
const mongoose = require('mongoose');
const SectionMaster = require('../src/models/SectionMaster.model');
const SectionLayout = require('../src/models/SectionLayout.model');

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/resume-job-portal';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB for SectionLayout seeding');
    seedSectionLayouts();
}).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

/**
 * Seed Section Layout data from frontend sectionLayoutStyles
 * Source: index_tempalte.html lines 1791-2222
 *
 * This script extracts static section layout templates and converts them to database records
 */
async function seedSectionLayouts() {
    try {
        console.log('Starting Section Layout seeding from frontend data...');

        // Drop old indexes that might conflict (legacy indexes)
        try {
            await SectionLayout.collection.dropIndex('sectionType_1_variantId_1');
            console.log('Dropped old sectionType_variantId index');
        } catch (err) {
            // Index might not exist, that's okay
            if (err.code !== 27) { // 27 = index not found
                console.log('Note: Old index not found (this is okay)');
            }
        }

        // Clear existing section layouts to ensure clean state
        const deleteResult = await SectionLayout.deleteMany({});
        console.log(`Cleared ${deleteResult.deletedCount} existing section layouts`);

        // Get all section masters
        const sectionMasters = await SectionMaster.find({}).lean();
        if (sectionMasters.length === 0) {
            console.error('❌ No Section Masters found. Please run seed-full-masters.js first.');
            process.exit(1);
        }

        // Create a map of code -> _id for easier lookup
        const masterMap = {};
        sectionMasters.forEach(master => {
            masterMap[master.code.toLowerCase()] = master._id;
            masterMap[master.name.toLowerCase()] = master._id;
        });

        console.log(`Found ${sectionMasters.length} section masters\n`);

        let totalCreated = 0;

        // ========== HEADER/PROFILE LAYOUTS ==========
        const headerLayouts = [
            {
                name: 'Centered',
                htmlContent: `<div style="text-align: center;"><div style="font-size: 28px; font-weight: 800; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">{{fullName}}</div><div style="font-size: 16px; color: var(--resume-primary); margin-bottom: 12px; font-weight: 500;">{{jobTitle}}</div><div style="font-size: 13px; color: var(--resume-muted);">{{email}} | {{phone}} | {{location}}</div></div>`
            },
            {
                name: 'Left Aligned Classic',
                htmlContent: `<div><div style="font-size: 32px; font-weight: 700; line-height: 1.2; margin-bottom: 8px;">{{fullName}}</div><div style="font-size: 18px; color: var(--resume-primary); margin-bottom: 16px;">{{jobTitle}}</div><div style="font-size: 13px; color: var(--resume-muted); display: flex; flex-wrap: wrap; gap: 16px;"><span>{{email}}</span><span>{{phone}}</span><span>{{location}}</span></div></div>`
            },
            {
                name: 'Inline Efficient',
                htmlContent: `<div style="border-bottom: 2px solid var(--resume-primary); padding-bottom: 20px; margin-bottom: 20px;"><div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 20px;"><div><h1 style="font-size: 26px; margin: 0; font-weight: 800;">{{fullName}}</h1><p style="margin: 4px 0 0; font-size: 16px; color: var(--resume-muted);">{{jobTitle}}</p></div><div style="text-align: right; font-size: 13px; line-height: 1.5;"><div>{{email}}</div><div>{{phone}}</div></div></div></div>`
            },
            {
                name: 'Visual Split',
                htmlContent: `<div style="display: grid; grid-template-columns: 1fr auto; gap: 40px; align-items: center;"><div><div style="font-size: 36px; font-weight: 300; letter-spacing: -1px;">{{firstName}} <strong>{{lastName}}</strong></div><div style="font-size: 14px; text-transform: uppercase; letter-spacing: 2px; margin-top: 8px; color: var(--resume-primary);">{{jobTitle}}</div></div><div style="text-align: right; font-size: 12px; border-left: 1px solid var(--border-color); padding-left: 20px;"><div style="margin-bottom: 4px;">{{email}}</div><div style="margin-bottom: 4px;">{{phone}}</div><div>{{location}}</div></div></div>`
            },
            {
                name: 'Icon Rich',
                htmlContent: `<div style="background: var(--left-bg); padding: 24px; border-radius: 12px; text-align: center;"><div style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">{{fullName}}</div><div style="background: var(--resume-primary); color: white; display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-bottom: 16px;">{{jobTitle}}</div><div style="display: flex; justify-content: center; gap: 16px; font-size: 13px; flex-wrap: wrap;"><span>📧 {{email}}</span><span>📱 {{phone}}</span><span>📍 {{location}}</span></div></div>`
            },
            {
                name: 'ATS Optimized (Minimal)',
                htmlContent: `<div style="text-align: center; border-bottom: 1px solid #000; padding-bottom: 12px; margin-bottom: 16px;"><div style="font-size: 24px; font-weight: bold; text-transform: uppercase;">{{fullName}}</div><div style="font-size: 14px; margin: 4px 0;">{{email}} • {{phone}} • {{location}}</div></div>`
            },
            {
                name: 'Banner Style',
                htmlContent: `<div style="background: linear-gradient(135deg, var(--resume-primary), var(--resume-accent)); color: white; padding: 32px 24px; margin: -20px -20px 20px -20px; text-align: center;"><div style="font-size: 32px; font-weight: 800; margin-bottom: 4px;">{{fullName}}</div><div style="font-size: 16px; opacity: 0.9; font-weight: 300;">{{jobTitle}}</div><div style="margin-top: 16px; font-size: 13px; opacity: 0.8;">{{email}} | {{phone}} | {{location}}</div></div>`
            },
            {
                name: 'Name Focus',
                htmlContent: `<div><div style="font-size: 52px; font-weight: 900; line-height: 0.9; letter-spacing: -2px; color: var(--resume-primary);">{{fullName}}</div><div style="font-size: 20px; font-weight: 300; margin-top: 8px; color: var(--resume-text);">{{jobTitle}}</div><div style="margin-top: 24px; padding-top: 16px; border-top: 4px solid var(--border-color); font-size: 13px;">{{email}} | {{phone}} | {{location}}</div></div>`
            },
            {
                name: 'Two Column Profile',
                htmlContent: `<div style="display: flex; gap: 20px; align-items: center;"><div style="flex: 1;"><div style="font-size: 14px; color: var(--resume-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">{{jobTitle}}</div><div style="font-size: 32px; font-weight: 700; color: var(--resume-primary);">{{fullName}}</div></div><div style="width: 180px; font-size: 12px; text-align: right; line-height: 1.6; color: var(--resume-muted);">{{email}}<br>{{phone}}<br>{{location}}</div></div>`
            },
            {
                name: 'Left Border Accent',
                htmlContent: `<div style="border-left: 8px solid var(--resume-primary); padding-left: 24px;"><div style="font-size: 32px; font-weight: 700;">{{fullName}}</div><div style="font-size: 18px; color: var(--resume-muted); margin-bottom: 8px;">{{jobTitle}}</div><div style="font-size: 13px; color: var(--resume-primary); font-weight: 500;">{{email}} | {{phone}} | {{location}}</div></div>`
            },
            {
                name: 'Boxed Header',
                htmlContent: `<div style="border: 2px solid var(--resume-primary); padding: 20px; border-radius: 0;"><div style="text-align: center;"><div style="font-size: 24px; font-weight: 700; text-transform: uppercase;">{{fullName}}</div><div style="height: 2px; width: 40px; background: var(--resume-primary); margin: 8px auto;"></div><div style="font-size: 14px;">{{jobTitle}}</div><div style="font-size: 11px; margin-top: 8px; color: var(--resume-muted);">{{email}} | {{phone}}</div></div></div>`
            }
        ];

        const headerMasterId = masterMap['header'];
        if (headerMasterId) {
            for (const layout of headerLayouts) {
                await SectionLayout.create({
                    name: layout.name,
                    sectionMaster: headerMasterId,
                    sectionType: 'Header',
                    htmlContent: layout.htmlContent,
                    cssContent: layout.cssContent || '',
                    status: 'Active',
                    accessType: 'FREE'
                });
                totalCreated++;
                console.log(`✓ Created Header layout: ${layout.name}`);
            }
        }

        // ========== SKILLS LAYOUTS ==========
        const skillsLayouts = [
            {
                name: 'Bullet List',
                htmlContent: `<ul style="columns: 2; list-style: square; padding-left: 20px; color: var(--resume-primary);">{{#each skills}}<li><span style="color: var(--resume-text);">{{this}}</span></li>{{/each}}</ul>`
            },
            {
                name: 'Pill Tags',
                htmlContent: `<div style="display: flex; flex-wrap: wrap; gap: 8px;">{{#each skills}}<span style="background: var(--resume-primary); color: white; padding: 4px 12px; border-radius: 16px; font-size: 12px;">{{this}}</span>{{/each}}</div>`
            },
            {
                name: 'Pill Outline',
                htmlContent: `<div style="display: flex; flex-wrap: wrap; gap: 8px;">{{#each skills}}<span style="border: 1px solid var(--resume-primary); color: var(--resume-primary); padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: 500;">{{this}}</span>{{/each}}</div>`
            },
            {
                name: 'Grid Boxes',
                htmlContent: `<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">{{#each skills}}<div style="background: var(--left-bg); padding: 8px; text-align: center; font-size: 12px; border-radius: 4px;">{{this}}</div>{{/each}}</div>`
            },
            {
                name: 'Inline List',
                htmlContent: `<div style="line-height: 1.6; font-size: 13px;">{{skills}}</div>`
            },
            {
                name: 'Spaced',
                htmlContent: `<div style="line-height: 1.8; font-size: 13px;">{{skills}}</div>`
            },
            {
                name: 'Left Border Items',
                htmlContent: `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">{{#each skills}}<div style="border-left: 3px solid var(--resume-primary); padding-left: 8px; font-size: 13px;">{{this}}</div>{{/each}}</div>`
            },
            {
                name: 'Checklist',
                htmlContent: `<div style="columns: 2;">{{#each skills}}<div style="margin-bottom: 4px; font-size: 13px;">✓ {{this}}</div>{{/each}}</div>`
            },
            {
                name: 'Tech Icons',
                htmlContent: `<div style="display: flex; flex-wrap: wrap; gap: 12px;">{{#each skills}}<div style="display: flex; align-items: center; gap: 6px; border: 1px solid var(--border-color); padding: 4px 8px; border-radius: 4px;"><span style="font-size: 14px;">⚡</span><span style="font-size: 12px; font-weight: 500;">{{this}}</span></div>{{/each}}</div>`
            }
        ];

        const skillsMasterId = masterMap['skills'];
        if (skillsMasterId) {
            for (const layout of skillsLayouts) {
                await SectionLayout.create({
                    name: layout.name,
                    sectionMaster: skillsMasterId,
                    sectionType: 'Skills',
                    htmlContent: layout.htmlContent,
                    cssContent: layout.cssContent || '',
                    status: 'Active',
                    accessType: 'FREE'
                });
                totalCreated++;
                console.log(`✓ Created Skills layout: ${layout.name}`);
            }
        }

        // ========== EXPERIENCE LAYOUTS ==========
        const experienceLayouts = [
            {
                name: 'Standard Block',
                htmlContent: `{{#each experience}}<div style="margin-bottom: 16px;"><div style="font-weight: 700; font-size: 15px;">{{title}}</div><div style="font-size: 13px; color: var(--resume-primary); margin-bottom: 4px;">{{company}} | {{date}}</div><div style="font-size: 13px; line-height: 1.5;">{{description}}</div></div>{{/each}}`
            },
            {
                name: 'Left Date',
                htmlContent: `{{#each experience}}<div style="display: flex; gap: 16px; margin-bottom: 16px;"><div style="width: 80px; flex-shrink: 0; font-size: 12px; color: var(--resume-muted); text-align: right; padding-top: 2px;">{{date}}</div><div style="flex: 1;"><div style="font-weight: 700; font-size: 15px;">{{title}}</div><div style="font-size: 13px; color: var(--resume-primary); margin-bottom: 4px;">{{company}}</div><div style="font-size: 13px; line-height: 1.5;">{{description}}</div></div></div>{{/each}}`
            },
            {
                name: 'Modern Timeline',
                htmlContent: `{{#each experience}}<div style="position: relative; padding-left: 20px; border-left: 2px solid var(--border-color); margin-bottom: 0; padding-bottom: 20px;"><div style="position: absolute; left: -6px; top: 2px; width: 10px; height: 10px; background: var(--resume-primary); border-radius: 50%;"></div><div style="font-weight: 700;">{{title}}</div><div style="font-size: 12px; color: var(--resume-muted); margin-bottom: 6px;">{{company}}, {{date}}</div><div style="font-size: 13px;">{{description}}</div></div>{{/each}}`
            },
            {
                name: 'Shadow Card',
                htmlContent: `{{#each experience}}<div style="background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.05); padding: 16px; border-radius: 8px; margin-bottom: 16px; border: 1px solid var(--border-color);"><div style="display: flex; justify-content: space-between;"><div style="font-weight: 700;">{{title}}</div><div style="font-size: 12px; color: var(--resume-muted);">{{date}}</div></div><div style="font-size: 13px; color: var(--resume-primary); margin-bottom: 8px;">{{company}}</div><div style="font-size: 13px;">{{description}}</div></div>{{/each}}`
            },
            {
                name: 'Minimal Inline',
                htmlContent: `{{#each experience}}<div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px dotted var(--border-color);"><div style="display: flex; justify-content: space-between; align-items: baseline;"><span style="font-weight: 700; font-size: 14px;">{{title}}</span><span style="font-size: 12px;">{{date}}</span></div><div style="font-size: 13px; font-style: italic; margin-bottom: 4px;">{{company}}</div><div style="font-size: 13px;">{{description}}</div></div>{{/each}}`
            },
            {
                name: 'Company Highlight',
                htmlContent: `{{#each experience}}<div style="margin-bottom: 16px;"><div style="font-size: 16px; font-weight: 800; color: var(--resume-primary);">{{company}}</div><div style="display: flex; justify-content: space-between; margin-bottom: 6px;"><span style="font-weight: 600;">{{title}}</span><span style="font-size: 12px; color: var(--resume-muted);">{{date}}</span></div><div style="font-size: 13px;">{{description}}</div></div>{{/each}}`
            },
            {
                name: 'Compact Stack',
                htmlContent: `{{#each experience}}<div style="margin-bottom: 10px;"><div style="font-weight: 700; font-size: 14px;">{{title}}</div><div style="font-size: 12px; color: var(--resume-muted); margin-bottom: 2px;">{{company}} • {{date}}</div><div style="font-size: 12px; line-height: 1.4;">{{description}}</div></div>{{/each}}`
            }
        ];

        const experienceMasterId = masterMap['experience'];
        if (experienceMasterId) {
            for (const layout of experienceLayouts) {
                await SectionLayout.create({
                    name: layout.name,
                    sectionMaster: experienceMasterId,
                    sectionType: 'Experience',
                    htmlContent: layout.htmlContent,
                    cssContent: layout.cssContent || '',
                    status: 'Active',
                    accessType: 'FREE'
                });
                totalCreated++;
                console.log(`✓ Created Experience layout: ${layout.name}`);
            }
        }

        // ========== EDUCATION LAYOUTS ==========
        const educationLayouts = [
            {
                name: 'Standard',
                htmlContent: `{{#each education}}<div style="margin-bottom: 12px;"><div style="font-weight: 700;">{{degree}}</div><div style="font-size: 13px;">{{institution}}, {{year}}</div><div style="font-size: 12px; color: var(--resume-muted);">{{details}}</div></div>{{/each}}`
            },
            {
                name: 'Institution First',
                htmlContent: `{{#each education}}<div style="margin-bottom: 12px;"><div style="font-weight: 700; color: var(--resume-primary);">{{institution}}</div><div style="font-size: 13px;">{{degree}} • {{year}}</div></div>{{/each}}`
            },
            {
                name: 'Inline Compact',
                htmlContent: `{{#each education}}<div style="margin-bottom: 8px; font-size: 13px;"><strong>{{degree}}</strong>, {{institution}} <span style="float: right; color: var(--resume-muted);">{{year}}</span></div>{{/each}}`
            },
            {
                name: 'Grid Layout',
                htmlContent: `{{#each education}}<div style="display: grid; grid-template-columns: auto 1fr; gap: 12px; margin-bottom: 12px;"><div style="font-weight: 700; min-width: 60px;">{{year}}</div><div><div style="font-weight: 600;">{{degree}}</div><div style="font-size: 13px;">{{institution}}</div></div></div>{{/each}}`
            },
            {
                name: 'Card Style',
                htmlContent: `{{#each education}}<div style="background: var(--left-bg); padding: 12px; border-radius: 6px; margin-bottom: 8px;"><div style="font-weight: 700; font-size: 14px;">{{degree}}</div><div style="font-size: 12px; display: flex; justify-content: space-between; margin-top: 4px;"><span>{{institution}}</span><span>{{year}}</span></div></div>{{/each}}`
            },
            {
                name: 'Timeline',
                htmlContent: `{{#each education}}<div style="border-left: 2px solid var(--resume-primary); padding-left: 12px; margin-bottom: 12px;"><div style="font-weight: 700;">{{degree}}</div><div style="font-size: 12px;">{{institution}}</div><div style="font-size: 11px; color: var(--resume-muted);">{{year}}</div></div>{{/each}}`
            }
        ];

        const educationMasterId = masterMap['education'];
        if (educationMasterId) {
            for (const layout of educationLayouts) {
                await SectionLayout.create({
                    name: layout.name,
                    sectionMaster: educationMasterId,
                    sectionType: 'Education',
                    htmlContent: layout.htmlContent,
                    cssContent: layout.cssContent || '',
                    status: 'Active',
                    accessType: 'FREE'
                });
                totalCreated++;
                console.log(`✓ Created Education layout: ${layout.name}`);
            }
        }

        // ========== PROJECTS LAYOUTS ==========
        const projectsLayouts = [
            {
                name: 'Standard',
                htmlContent: `{{#each projects}}<div style="margin-bottom: 14px;"><div style="font-weight: 700;">{{name}}</div><div style="font-size: 12px; color: var(--resume-primary); margin-bottom: 4px;">{{tech}}</div><div style="font-size: 13px;">{{description}}</div></div>{{/each}}`
            },
            {
                name: 'Card',
                htmlContent: `{{#each projects}}<div style="border: 1px solid var(--border-color); padding: 12px; border-radius: 6px; margin-bottom: 10px;"><div style="font-weight: 700; color: var(--resume-primary);">{{name}}</div><div style="font-size: 13px; margin-top: 4px;">{{description}}</div></div>{{/each}}`
            },
            {
                name: 'Tech Highlight',
                htmlContent: `{{#each projects}}<div style="margin-bottom: 14px;"><div style="font-weight: 700;">{{name}} <span style="font-weight: 400; font-size: 12px; background: var(--left-bg); padding: 2px 6px; border-radius: 4px;">{{tech}}</span></div><div style="font-size: 13px; margin-top: 4px;">{{description}}</div></div>{{/each}}`
            },
            {
                name: 'Minimal',
                htmlContent: `{{#each projects}}<div style="margin-bottom: 8px;"><span style="font-weight: 700; font-size: 14px;">{{name}}:</span> <span style="font-size: 13px;">{{description}}</span></div>{{/each}}`
            }
        ];

        const projectsMasterId = masterMap['projects'];
        if (projectsMasterId) {
            for (const layout of projectsLayouts) {
                await SectionLayout.create({
                    name: layout.name,
                    sectionMaster: projectsMasterId,
                    sectionType: 'Projects',
                    htmlContent: layout.htmlContent,
                    cssContent: layout.cssContent || '',
                    status: 'Active',
                    accessType: 'FREE'
                });
                totalCreated++;
                console.log(`✓ Created Projects layout: ${layout.name}`);
            }
        }

        // ========== GENERIC LIST LAYOUTS (for Languages, Certifications, Awards, etc.) ==========
        const genericListLayouts = [
            {
                name: 'Standard List',
                htmlContent: `{{#each items}}<div style="margin-bottom:8px;">• {{this}}</div>{{/each}}`
            },
            {
                name: 'Inline List',
                htmlContent: `{{#each items}}<span style="margin-right:12px;">{{this}}</span>{{/each}}`
            },
            {
                name: 'Grid Layout',
                htmlContent: `{{#each items}}<div style="border:1px solid var(--border-color);padding:8px;border-radius:4px;">{{this}}</div>{{/each}}`
            },
            {
                name: 'Minimal',
                htmlContent: `{{#each items}}<div style="font-size:13px;">{{this}}</div>{{/each}}`
            },
            {
                name: 'Icon Based',
                htmlContent: `{{#each items}}<div style="display:flex;gap:8px;align-items:center;"><span>🔹</span><span>{{this}}</span></div>{{/each}}`
            }
        ];

        // Apply generic list layouts to multiple section types
        const genericSections = ['languages', 'certifications', 'awards', 'interests', 'references'];
        for (const sectionType of genericSections) {
            const masterId = masterMap[sectionType];
            if (masterId) {
                for (const layout of genericListLayouts) {
                    await SectionLayout.create({
                        name: layout.name,
                        sectionMaster: masterId,
                        sectionType: sectionType.charAt(0).toUpperCase() + sectionType.slice(1),
                        htmlContent: layout.htmlContent,
                        cssContent: layout.cssContent || '',
                        status: 'Active',
                        accessType: 'FREE'
                    });
                    totalCreated++;
                }
                console.log(`✓ Created ${genericListLayouts.length} layouts for ${sectionType}`);
            }
        }

        // ========== SUMMARY LAYOUTS ==========
        const summaryLayouts = [
            {
                name: 'Standard Paragraph',
                htmlContent: `<p style="line-height: 1.6; font-size: 14px; color: var(--resume-text);">{{summary}}</p>`
            },
            {
                name: 'Box Style',
                htmlContent: `<div style="background: var(--left-bg); padding: 16px; border-radius: 8px; font-size: 14px; line-height: 1.6;">{{summary}}</div>`
            },
            {
                name: 'Italic Emphasis',
                htmlContent: `<p style="line-height: 1.7; font-size: 14px; font-style: italic; color: var(--resume-muted);">{{summary}}</p>`
            },
            {
                name: 'Minimal',
                htmlContent: `<div style="font-size: 13px; line-height: 1.6;">{{summary}}</div>`
            }
        ];

        const summaryMasterId = masterMap['summary'];
        if (summaryMasterId) {
            for (const layout of summaryLayouts) {
                await SectionLayout.create({
                    name: layout.name,
                    sectionMaster: summaryMasterId,
                    sectionType: 'Summary',
                    htmlContent: layout.htmlContent,
                    cssContent: layout.cssContent || '',
                    status: 'Active',
                    accessType: 'FREE'
                });
                totalCreated++;
                console.log(`✓ Created Summary layout: ${layout.name}`);
            }
        }

        console.log(`\n✅ Successfully created ${totalCreated} section layouts`);
        console.log('Section Layout seeding completed!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding section layouts:', error);
        process.exit(1);
    }
}
