// backend/src/models/Theme.model.js
const mongoose = require('mongoose');

const themeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    colors: {
        primary: { type: String, default: '#000000' },
        secondary: { type: String, default: '#666666' },
        accent: { type: String, default: '#333333' },
        text: { type: String, default: '#000000' },
        background: { type: String, default: '#ffffff' }
    },
    fonts: {
        heading: { type: String, default: 'Roboto' },
        body: { type: String, default: 'Roboto' }
    },
    spacing: {
        margin: { type: String, default: '1rem' },
        padding: { type: String, default: '1rem' }
    },
    previewImage: {
        type: String, default: ''
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
    metadata: {
        type: Object,
        default: {}
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Theme', themeSchema);
