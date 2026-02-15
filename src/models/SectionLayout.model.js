const mongoose = require('mongoose');

const sectionLayoutSchema = new mongoose.Schema({
    name: {
        type: String, // e.g., "Timeline Style", "Card Style"
        required: true,
        trim: true
    },
    sectionMaster: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SectionMaster',
        required: true
    },
    // We keep sectionType for backward compatibility during migration, but it should be derived from sectionMaster
    sectionType: {
        type: String,
        required: false // Made optional as we move to sectionMaster
    },
    htmlContent: {
        type: String,
        required: true
    },
    cssContent: {
        type: String,
        default: ''
    },
    config: {
        type: Object,
        default: {}
    },
    previewImage: {
        type: String,
        default: ''
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    accessType: {
        type: String,
        enum: ['FREE', 'PREMIUM', 'BOTH'],
        default: 'FREE'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Ensure unique name per section master
sectionLayoutSchema.index({ sectionMaster: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('SectionLayout', sectionLayoutSchema);
