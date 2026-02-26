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
    htmlContent: {
        type: String,
        required: true
    },
    config: {
        type: Object,
        default: {}
    },
    previewImage: {
        type: String,
        default: ''
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
