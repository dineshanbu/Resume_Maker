require('dotenv').config();
const mongoose = require('mongoose');
const Theme = require('../src/models/Theme.model');

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/resume-job-portal';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB for Theme seeding');
    seedThemes();
}).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

/**
 * Seed Theme data from frontend stylePresets
 * Source: index_tempalte.html lines 2225-2746
 */
async function seedThemes() {
    try {
        console.log('Starting Theme seeding from frontend data...');

        // Clear existing themes to ensure clean state
        const deleteResult = await Theme.deleteMany({});
        console.log(`Cleared ${deleteResult.deletedCount} existing themes`);

        // Theme presets from frontend (stylePresets array)
        const themePresets = [
            {
                id: 'classic-professional',
                name: 'Classic Professional',
                icon: '📄',
                description: 'Serif font, centered header, conservative',
                styles: {
                    fontFamily: 'Georgia',
                    primaryColor: '#2c3e50',
                    accentColor: '#34495e',
                    textColor: '#2c3e50',
                    mutedColor: '#7f8c8d',
                    headingSize: 20,
                    bodySize: 13,
                    lineHeight: 1.7,
                    letterSpacing: 0.3,
                    headingWeight: 700,
                    bodyWeight: 400,
                    sectionSpacing: 24,
                    leftColumnBg: '#ffffff',
                    rightColumnBg: '#ffffff',
                    dividerColor: '#bdc3c7',
                    pageMargin: 50,
                    columnGap: 30,
                    titleTransform: 'uppercase'
                }
            },
            {
                id: 'modern-minimal',
                name: 'Modern Minimal',
                icon: '✨',
                description: 'Sans-serif, two column, bold headers',
                styles: {
                    fontFamily: 'Inter',
                    primaryColor: '#111827',
                    accentColor: '#374151',
                    textColor: '#1f2937',
                    mutedColor: '#6b7280',
                    headingSize: 22,
                    bodySize: 14,
                    lineHeight: 1.6,
                    letterSpacing: -0.5,
                    headingWeight: 800,
                    bodyWeight: 400,
                    sectionSpacing: 20,
                    leftColumnBg: '#ffffff',
                    rightColumnBg: '#ffffff',
                    dividerColor: '#e5e7eb',
                    pageMargin: 40,
                    columnGap: 25,
                    titleTransform: 'uppercase'
                }
            },
            {
                id: 'creative-designer',
                name: 'Creative Designer',
                icon: '🎨',
                description: 'Accent colors, icons, colored sidebar',
                styles: {
                    fontFamily: 'Helvetica',
                    primaryColor: '#ec4899',
                    accentColor: '#db2777',
                    textColor: '#2c3e50',
                    mutedColor: '#7f8c8d',
                    headingSize: 19,
                    bodySize: 13,
                    lineHeight: 1.65,
                    letterSpacing: 0.2,
                    headingWeight: 700,
                    bodyWeight: 400,
                    sectionSpacing: 22,
                    leftColumnBg: '#fdf2f8',
                    rightColumnBg: '#ffffff',
                    dividerColor: '#ec4899',
                    pageMargin: 35,
                    columnGap: 20,
                    titleTransform: 'capitalize'
                }
            },
            {
                id: 'executive-premium',
                name: 'Executive Premium',
                icon: '💼',
                description: 'Dark header, gold accents, strong hierarchy',
                styles: {
                    fontFamily: 'Times New Roman',
                    primaryColor: '#1a1a2e',
                    accentColor: '#d4af37',
                    textColor: '#1a1a2e',
                    mutedColor: '#6c757d',
                    headingSize: 21,
                    bodySize: 14,
                    lineHeight: 1.75,
                    letterSpacing: 0.5,
                    headingWeight: 700,
                    bodyWeight: 400,
                    sectionSpacing: 28,
                    leftColumnBg: '#f8f9fa',
                    rightColumnBg: '#ffffff',
                    dividerColor: '#d4af37',
                    pageMargin: 45,
                    columnGap: 35,
                    titleTransform: 'uppercase'
                }
            },
            {
                id: 'compact-one-page',
                name: 'Compact One-Page',
                icon: '📑',
                description: 'Small font, tight spacing, ATS friendly',
                styles: {
                    fontFamily: 'Arial',
                    primaryColor: '#333333',
                    accentColor: '#555555',
                    textColor: '#333333',
                    mutedColor: '#666666',
                    headingSize: 16,
                    bodySize: 11,
                    lineHeight: 1.4,
                    letterSpacing: 0,
                    headingWeight: 700,
                    bodyWeight: 400,
                    sectionSpacing: 12,
                    leftColumnBg: '#ffffff',
                    rightColumnBg: '#ffffff',
                    dividerColor: '#cccccc',
                    pageMargin: 20,
                    columnGap: 15,
                    titleTransform: 'uppercase'
                }
            },
            {
                id: 'tech-startup',
                name: 'Tech / Startup',
                icon: '🚀',
                description: 'Clean grid, code fonts, modern blue',
                styles: {
                    fontFamily: 'Verdana',
                    primaryColor: '#2563eb',
                    accentColor: '#3b82f6',
                    textColor: '#1f2937',
                    mutedColor: '#6b7280',
                    headingSize: 18,
                    bodySize: 13,
                    lineHeight: 1.6,
                    letterSpacing: 0,
                    headingWeight: 600,
                    bodyWeight: 400,
                    sectionSpacing: 18,
                    leftColumnBg: '#eff6ff',
                    rightColumnBg: '#ffffff',
                    dividerColor: '#bfdbfe',
                    pageMargin: 35,
                    columnGap: 20,
                    titleTransform: 'capitalize'
                }
            },
            {
                id: 'elegant-serif',
                name: 'Elegant Serif',
                icon: '✒️',
                description: 'High-end magazine look, refined typography',
                styles: {
                    fontFamily: 'Palatino',
                    primaryColor: '#4a3f35',
                    accentColor: '#8a7e72',
                    textColor: '#2b2622',
                    mutedColor: '#8a7e72',
                    headingSize: 24,
                    bodySize: 13.5,
                    lineHeight: 1.8,
                    letterSpacing: 0.5,
                    headingWeight: 500,
                    bodyWeight: 400,
                    sectionSpacing: 30,
                    leftColumnBg: '#fcfbf9',
                    rightColumnBg: '#ffffff',
                    dividerColor: '#e0dcd5',
                    pageMargin: 60,
                    columnGap: 40,
                    titleTransform: 'uppercase'
                }
            },
            {
                id: 'dark-header',
                name: 'Dark Header',
                icon: '⬛',
                description: 'Bold dark top section, corporate feel',
                styles: {
                    fontFamily: 'Arial',
                    primaryColor: '#171717',
                    accentColor: '#404040',
                    textColor: '#171717',
                    mutedColor: '#737373',
                    headingSize: 20,
                    bodySize: 14,
                    lineHeight: 1.6,
                    letterSpacing: 0,
                    headingWeight: 700,
                    bodyWeight: 400,
                    sectionSpacing: 22,
                    leftColumnBg: '#ffffff',
                    rightColumnBg: '#ffffff',
                    dividerColor: '#171717',
                    pageMargin: 40,
                    columnGap: 30,
                    titleTransform: 'uppercase'
                }
            },
            {
                id: 'pastel-soft',
                name: 'Pastel Soft',
                icon: '🌸',
                description: 'Friendly, approachable, soft colors',
                styles: {
                    fontFamily: 'Trebuchet MS',
                    primaryColor: '#8b5cf6',
                    accentColor: '#a78bfa',
                    textColor: '#4b5563',
                    mutedColor: '#9ca3af',
                    headingSize: 20,
                    bodySize: 14,
                    lineHeight: 1.7,
                    letterSpacing: 0.2,
                    headingWeight: 600,
                    bodyWeight: 400,
                    sectionSpacing: 24,
                    leftColumnBg: '#f5f3ff',
                    rightColumnBg: '#ffffff',
                    dividerColor: '#ddd6fe',
                    pageMargin: 40,
                    columnGap: 25,
                    titleTransform: 'none'
                }
            },
            {
                id: 'bold-accent',
                name: 'Bold Accent',
                icon: '⚡',
                description: 'Striking accent colors, high energy',
                styles: {
                    fontFamily: 'Inter',
                    primaryColor: '#dc2626',
                    accentColor: '#ef4444',
                    textColor: '#111827',
                    mutedColor: '#4b5563',
                    headingSize: 22,
                    bodySize: 14,
                    lineHeight: 1.5,
                    letterSpacing: -0.5,
                    headingWeight: 900,
                    bodyWeight: 500,
                    sectionSpacing: 20,
                    leftColumnBg: '#fef2f2',
                    rightColumnBg: '#ffffff',
                    dividerColor: '#fee2e2',
                    pageMargin: 35,
                    columnGap: 20,
                    titleTransform: 'uppercase'
                }
            },
            {
                id: 'neutral-gray',
                name: 'Neutral Gray',
                icon: '🌫️',
                description: 'Understated, clean, monochrome',
                styles: {
                    fontFamily: 'Helvetica',
                    primaryColor: '#525252',
                    accentColor: '#737373',
                    textColor: '#262626',
                    mutedColor: '#737373',
                    headingSize: 18,
                    bodySize: 13.5,
                    lineHeight: 1.6,
                    letterSpacing: 0,
                    headingWeight: 600,
                    bodyWeight: 400,
                    sectionSpacing: 22,
                    leftColumnBg: '#fafafa',
                    rightColumnBg: '#ffffff',
                    dividerColor: '#e5e5e5',
                    pageMargin: 45,
                    columnGap: 30,
                    titleTransform: 'none'
                }
            },
            {
                id: 'high-contrast',
                name: 'High Contrast',
                icon: '👁️',
                description: 'Black and white, maximum readability',
                styles: {
                    fontFamily: 'Arial',
                    primaryColor: '#000000',
                    accentColor: '#000000',
                    textColor: '#000000',
                    mutedColor: '#000000',
                    headingSize: 20,
                    bodySize: 15,
                    lineHeight: 1.5,
                    letterSpacing: 0,
                    headingWeight: 700,
                    bodyWeight: 500,
                    sectionSpacing: 20,
                    leftColumnBg: '#ffffff',
                    rightColumnBg: '#ffffff',
                    dividerColor: '#000000',
                    pageMargin: 40,
                    columnGap: 25,
                    titleTransform: 'uppercase'
                }
            },
            {
                id: 'clean-academic',
                name: 'Clean Academic',
                icon: '🎓',
                description: 'Ideal for CVs/Resumes, dense information',
                styles: {
                    fontFamily: 'Times New Roman',
                    primaryColor: '#1e3a8a',
                    accentColor: '#1e40af',
                    textColor: '#1f2937',
                    mutedColor: '#4b5563',
                    headingSize: 18,
                    bodySize: 12,
                    lineHeight: 1.4,
                    letterSpacing: 0,
                    headingWeight: 700,
                    bodyWeight: 400,
                    sectionSpacing: 16,
                    leftColumnBg: '#ffffff',
                    rightColumnBg: '#ffffff',
                    dividerColor: '#e5e7eb',
                    pageMargin: 30,
                    columnGap: 20,
                    titleTransform: 'uppercase'
                }
            },
            {
                id: 'professional-blue',
                name: 'Professional Blue',
                icon: '👔',
                description: 'Trustworthy corporate blue theme',
                styles: {
                    fontFamily: 'Trebuchet MS',
                    primaryColor: '#0369a1',
                    accentColor: '#0ea5e9',
                    textColor: '#334155',
                    mutedColor: '#64748b',
                    headingSize: 20,
                    bodySize: 14,
                    lineHeight: 1.6,
                    letterSpacing: 0.2,
                    headingWeight: 700,
                    bodyWeight: 400,
                    sectionSpacing: 22,
                    leftColumnBg: '#f0f9ff',
                    rightColumnBg: '#ffffff',
                    dividerColor: '#bae6fd',
                    pageMargin: 40,
                    columnGap: 30,
                    titleTransform: 'capitalize'
                }
            },
            {
                id: 'swiss-international',
                name: 'Swiss Style',
                icon: '🇨🇭',
                description: 'Grid-based, strong typography, objective',
                styles: {
                    fontFamily: 'Helvetica',
                    primaryColor: '#d62828',
                    accentColor: '#f77f00',
                    textColor: '#1a1a1a',
                    mutedColor: '#666666',
                    headingSize: 26,
                    bodySize: 14,
                    lineHeight: 1.4,
                    letterSpacing: -1,
                    headingWeight: 700,
                    bodyWeight: 400,
                    sectionSpacing: 32,
                    leftColumnBg: '#ffffff',
                    rightColumnBg: '#ffffff',
                    dividerColor: '#000000',
                    pageMargin: 50,
                    columnGap: 40,
                    titleTransform: 'lowercase'
                }
            },
            {
                id: 'slate-corporate',
                name: 'Slate Corporate',
                icon: '🏙️',
                description: 'Serious, professional blue-grey theme',
                styles: {
                    fontFamily: 'Muli, sans-serif',
                    primaryColor: '#334155',
                    accentColor: '#475569',
                    textColor: '#1e293b',
                    mutedColor: '#64748b',
                    headingSize: 20,
                    bodySize: 14,
                    lineHeight: 1.6,
                    letterSpacing: 0,
                    headingWeight: 700,
                    bodyWeight: 400,
                    sectionSpacing: 24,
                    leftColumnBg: '#f1f5f9',
                    rightColumnBg: '#ffffff',
                    dividerColor: '#cbd5e1',
                    pageMargin: 40,
                    columnGap: 30,
                    titleTransform: 'uppercase'
                }
            },
            {
                id: 'ivory-elegant',
                name: 'Ivory Elegant',
                icon: '📜',
                description: 'Warm background, classic serif, distinctive',
                styles: {
                    fontFamily: 'Garamond, serif',
                    primaryColor: '#432818',
                    accentColor: '#99582a',
                    textColor: '#2f1b0c',
                    mutedColor: '#8a6a58',
                    headingSize: 24,
                    bodySize: 15,
                    lineHeight: 1.7,
                    letterSpacing: 0.2,
                    headingWeight: 600,
                    bodyWeight: 400,
                    sectionSpacing: 30,
                    leftColumnBg: '#fefae0',
                    rightColumnBg: '#fefae0',
                    dividerColor: '#bb9457',
                    pageMargin: 50,
                    columnGap: 40,
                    titleTransform: 'capitalize'
                }
            },
            {
                id: 'navy-gold',
                name: 'Navy & Gold',
                icon: '⚓',
                description: 'Premium executive, high contrast',
                styles: {
                    fontFamily: 'Times New Roman, serif',
                    primaryColor: '#001d3d',
                    accentColor: '#ffc300',
                    textColor: '#000814',
                    mutedColor: '#6c757d',
                    headingSize: 22,
                    bodySize: 14,
                    lineHeight: 1.6,
                    letterSpacing: 0.5,
                    headingWeight: 800,
                    bodyWeight: 400,
                    sectionSpacing: 26,
                    leftColumnBg: '#ffffff',
                    rightColumnBg: '#ffffff',
                    dividerColor: '#ffc300',
                    pageMargin: 40,
                    columnGap: 30,
                    titleTransform: 'uppercase'
                }
            },
            {
                id: 'minimal-mono',
                name: 'Minimal Mono',
                icon: '⌨️',
                description: 'Technical, code-like, very clean',
                styles: {
                    fontFamily: 'Consolas, monospace',
                    primaryColor: '#000000',
                    accentColor: '#555555',
                    textColor: '#000000',
                    mutedColor: '#666666',
                    headingSize: 16,
                    bodySize: 12,
                    lineHeight: 1.5,
                    letterSpacing: -0.5,
                    headingWeight: 700,
                    bodyWeight: 400,
                    sectionSpacing: 20,
                    leftColumnBg: '#ffffff',
                    rightColumnBg: '#ffffff',
                    dividerColor: '#000000',
                    pageMargin: 30,
                    columnGap: 20,
                    titleTransform: 'lowercase'
                }
            },
            {
                id: 'forest-clean',
                name: 'Forest Clean',
                icon: '🌲',
                description: 'Natural greens, calming, readable',
                styles: {
                    fontFamily: 'Trebuchet MS, sans-serif',
                    primaryColor: '#2d6a4f',
                    accentColor: '#40916c',
                    textColor: '#1b4332',
                    mutedColor: '#74c69d',
                    headingSize: 20,
                    bodySize: 14,
                    lineHeight: 1.6,
                    letterSpacing: 0.2,
                    headingWeight: 600,
                    bodyWeight: 400,
                    sectionSpacing: 24,
                    leftColumnBg: '#e9f5db',
                    rightColumnBg: '#ffffff',
                    dividerColor: '#b7e4c7',
                    pageMargin: 40,
                    columnGap: 30,
                    titleTransform: 'uppercase'
                }
            }
        ];

        // Map frontend styles to Theme model schema
        let createdCount = 0;
        for (const preset of themePresets) {
            const s = preset.styles;

            // Map to Theme model fields
            const themeData = {
                name: preset.name,
                colors: {
                    primary: s.primaryColor,
                    secondary: s.leftColumnBg || s.rightColumnBg,
                    accent: s.accentColor,
                    text: s.textColor,
                    background: s.rightColumnBg
                },
                fonts: {
                    heading: s.fontFamily,
                    body: s.fontFamily,
                    sizeScale: 1.0
                },
                spacing: {
                    margin: `${s.pageMargin}px`,
                    padding: `${s.sectionSpacing}px`,
                    lineHeight: s.lineHeight
                },
                // Store additional metadata as extended properties
                metadata: {
                    icon: preset.icon,
                    description: preset.description,
                    headingSize: s.headingSize,
                    bodySize: s.bodySize,
                    letterSpacing: s.letterSpacing,
                    headingWeight: s.headingWeight,
                    bodyWeight: s.bodyWeight,
                    leftColumnBg: s.leftColumnBg,
                    dividerColor: s.dividerColor,
                    columnGap: s.columnGap,
                    titleTransform: s.titleTransform,
                    mutedColor: s.mutedColor
                },
                status: 'Active',
                accessType: 'FREE', // Can be updated to PREMIUM for specific themes
                isDefault: preset.id === 'modern-minimal' // Set Modern Minimal as default
            };

            await Theme.create(themeData);
            createdCount++;
            console.log(`✓ Created theme: ${preset.name}`);
        }

        console.log(`\n✅ Successfully created ${createdCount} themes`);
        console.log('Theme seeding completed!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding themes:', error);
        process.exit(1);
    }
}
