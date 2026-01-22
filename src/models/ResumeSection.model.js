// backend/src/models/ResumeSection.model.js
const mongoose = require('mongoose');

const resumeSectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Section name is required'],
    trim: true
  },
  order: {
    type: Number,
    required: [true, 'Order is required'],
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
resumeSectionSchema.index({ order: 1 });
resumeSectionSchema.index({ status: 1 });

const ResumeSection = mongoose.model('ResumeSection', resumeSectionSchema);

module.exports = ResumeSection;
