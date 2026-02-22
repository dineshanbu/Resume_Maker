// backend/src/models/Plan.model.js
const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Plan name is required'],
    enum: ['FREE', 'PREMIUM', 'PRO'],
    unique: true,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Plan price is required'],
    default: 0,
    min: 0
  },
  validity: {
    type: Number, // In days
    default: 30
  },
  validityUnit: {
    type: String,
    enum: ['days', 'month', 'year'],
    default: 'month'
  },
  maxResumeDownloads: {
    type: Number,
    default: 0 // 0 means not allowed, -1 means unlimited
  },
  resumeLimit: {
    type: Number,
    default: 2 // -1 for unlimited
  },
  maxFreeTemplates: {
    type: Number,
    default: 0
  },
  templateAccess: {
    type: String,
    enum: ['free', 'premium', 'all'],
    default: 'free'
  },
  featuresChecklist: [{
    type: String
  }],
  features: {
    resumeCreateUnlimited: { type: Boolean, default: false },
    maxFreeTemplates: { type: Number, default: 3 },
    premiumTemplatesAccess: { type: Boolean, default: false },
    resumeExportPdf: { type: Boolean, default: true },
    resumeExportHtml: { type: Boolean, default: false },
    resumeDownloadLimit: { type: Number, default: 0 },
    resumeShareUrl: { type: Boolean, default: true },
    resumeUrlValidityDays: { type: Number, default: 1 },
    autoApplyJobs: { type: Boolean, default: false },
    resumeAnalytics: { type: Boolean, default: false }
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly', 'one-time'],
    default: 'monthly'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes
planSchema.index({ isActive: 1 });
planSchema.index({ status: 1 });

// Prevent deletion of default plans
planSchema.pre('remove', function (next) {
  if (this.name === 'FREE') {
    return next(new Error('Cannot delete default FREE plan'));
  }
  next();
});

const Plan = mongoose.model('Plan', planSchema);

module.exports = Plan;
