// backend/src/models/JobType.model.js
const mongoose = require('mongoose');

const jobTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Job type name is required'],
    trim: true,
    unique: true
  },
  description: {
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

// Indexes
jobTypeSchema.index({ status: 1 });

const JobType = mongoose.model('JobType', jobTypeSchema);

module.exports = JobType;
