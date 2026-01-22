// backend/src/models/LanguageMaster.model.js
const mongoose = require('mongoose');

const languageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Language name is required'],
    trim: true,
    unique: true
  },
  languageCode: {
    type: String,
    trim: true
  },
  nativeName: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, {
  timestamps: true
});

languageSchema.index({ status: 1 });

const LanguageMaster = mongoose.model('LanguageMaster', languageSchema);

module.exports = LanguageMaster;
