const mongoose = require('mongoose');

const sectionMasterSchema = new mongoose.Schema({
    name: {
        type: String, // e.g., "Experience", "Education"
        required: true,
        unique: true,
        trim: true
    },
    code: {
        type: String, // e.g., "EXPERIENCE"
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    icon: {
        type: String, // Material icon name or similar
        default: 'extension'
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
    },
    order: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SectionMaster', sectionMasterSchema);
