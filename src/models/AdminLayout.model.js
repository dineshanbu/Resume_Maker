// backend/src/models/AdminLayout.model.js
const mongoose = require('mongoose');

const adminLayoutSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    code: {
        type: String, // Maps to LayoutDefinition at frontend (e.g. 'single-column')
        required: true,
        unique: true,
        trim: true
    },
    htmlContent: {
        type: String,
        required: true
    },
    cssContent: {
        type: String,
        default: ''
    },
    previewImage: {
        type: String,
        default: ''
    },
    // New fields for Visual Builder Mapping
    type: {
        type: String, // 'one-column', 'two-column', 'header-body'
        default: 'one-column'
    },
    columnWidths: {
        left: { type: Number, default: 100 },
        right: { type: Number, default: 0 }
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

module.exports = mongoose.model('AdminLayout', adminLayoutSchema);
