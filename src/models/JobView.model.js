// backend/src/models/JobView.model.js
const mongoose = require('mongoose');

const jobViewSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  userRole: {
    type: String,
    enum: ['user', 'admin', 'employer'],
    default: null
  },
  userName: {
    type: String,
    default: null
  },
  userEmail: {
    type: String,
    default: null
  },
  isGuest: {
    type: Boolean,
    default: true
  },
  deviceType: {
    type: String,
    enum: ['Mobile', 'Desktop', 'Tablet'],
    default: 'Desktop'
  },
  location: {
    type: String,
    default: null
  },
  source: {
    type: String,
    enum: ['Dashboard', 'Landing'],
    default: 'Landing'
  },
  viewDate: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
jobViewSchema.index({ jobId: 1, viewDate: -1 });
jobViewSchema.index({ jobId: 1, userId: 1 });
jobViewSchema.index({ jobId: 1, isGuest: 1 });

const JobView = mongoose.model('JobView', jobViewSchema);

module.exports = JobView;
