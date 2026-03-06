const mongoose = require('mongoose');

const sectionLayoutSchema = new mongoose.Schema({
    sectionType: {
        type: String, // e.g., 'header', 'summary', 'experience', 'education', 'skills', 'projects', 'languages', 'certifications', 'awards', 'interests', 'references'
        required: true,
        trim: true,
        lowercase: true
    },
    layoutName: {
        type: String,
        required: true,
        trim: true
    },
    layoutKey: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    html: {
        type: String,
        required: true
    },
    css: {
        type: String,
        default: ''
    },
    thumbnail: {
        type: String, // preview image url
        default: ''
    },
    category: {
        type: String,
        enum: ['standard', 'premium'],
        default: 'standard'
    },
    isPremium: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    preview_data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Pre-save: sync category with isPremium
sectionLayoutSchema.pre('save', function (next) {
    if (this.isModified('category')) {
        this.isPremium = this.category === 'premium';
    } else if (this.isModified('isPremium')) {
        this.category = this.isPremium ? 'premium' : 'standard';
    }
    next();
});

// Index for getting active layouts by section type
sectionLayoutSchema.index({ sectionType: 1, isActive: 1 });
sectionLayoutSchema.index({ sectionType: 1, category: 1, isActive: 1 });

module.exports = mongoose.model('SectionLayout', sectionLayoutSchema);
