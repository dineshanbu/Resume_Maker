// backend/src/models/JobRole.model.js
const mongoose = require('mongoose');

const jobRoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    trim: true
  },
  jobCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobCategory',
    required: [true, 'Job category is required']
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
jobRoleSchema.index({ jobCategoryId: 1 });
jobRoleSchema.index({ status: 1 });

const JobRole = mongoose.model('JobRole', jobRoleSchema);

module.exports = JobRole;
