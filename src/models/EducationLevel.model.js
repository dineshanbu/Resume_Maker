// backend/src/models/EducationLevel.model.js
const mongoose = require('mongoose');

const educationLevelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Education level name is required'],
    trim: true,
    unique: true
  },
  levelCode: {
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

educationLevelSchema.index({ status: 1 });

const EducationLevel = mongoose.model('EducationLevel', educationLevelSchema);

module.exports = EducationLevel;
