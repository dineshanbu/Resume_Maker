// backend/src/models/AppSettings.model.js
const mongoose = require('mongoose');

const appSettingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['resume', 'subscription', 'email', 'general'],
    default: 'general'
  }
}, {
  timestamps: true
});

// Indexes
appSettingsSchema.index({ key: 1 });
appSettingsSchema.index({ category: 1 });

const AppSettings = mongoose.model('AppSettings', appSettingsSchema);

module.exports = AppSettings;
