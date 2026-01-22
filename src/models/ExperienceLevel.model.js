// backend/src/models/ExperienceLevel.model.js
const mongoose = require('mongoose');

const experienceLevelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Experience level name is required'],
    trim: true
  },
  minYears: {
    type: Number,
    required: [true, 'Minimum years is required'],
    min: 0
  },
  maxYears: {
    type: Number,
    required: [true, 'Maximum years is required'],
    min: 0
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, {
  timestamps: true
});

// Indexes
experienceLevelSchema.index({ status: 1 });

const ExperienceLevel = mongoose.model('ExperienceLevel', experienceLevelSchema);

module.exports = ExperienceLevel;
