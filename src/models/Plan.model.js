// backend/src/models/Plan.model.js
const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Plan name is required'],
    enum: ['FREE', 'PRO'],
    unique: true,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Plan price is required'],
    default: 0,
    min: 0
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  maxResumesAllowed: {
    type: Number,
    default: null, // null means unlimited
    min: 0
  },
  features: {
    resumeCreateUnlimited: {
      type: Boolean,
      default: true
    },
    maxFreeTemplates: {
      type: Number,
      default: 5
    },
    premiumTemplatesAccess: {
      type: Boolean,
      default: false
    },
    resumeExportPdf: {
      type: Boolean,
      default: false
    },
    resumeExportHtml: {
      type: Boolean,
      default: false
    },
    resumeDownloadLimit: {
      type: mongoose.Schema.Types.Mixed, // Can be number or 'unlimited'
      default: 0
    },
    resumeShareUrl: {
      type: Boolean,
      default: false
    },
    resumeUrlValidityDays: {
      type: Number,
      default: 0
    },
    autoApplyJobs: {
      type: Boolean,
      default: false
    },
    resumeAnalytics: {
      type: Boolean,
      default: false
    }
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes
planSchema.index({ name: 1 });
planSchema.index({ isActive: 1 });

// Prevent deletion of default plans
planSchema.pre('remove', function(next) {
  if (this.name === 'FREE' || this.name === 'PRO') {
    return next(new Error('Cannot delete default plans (FREE or PRO)'));
  }
  next();
});

const Plan = mongoose.model('Plan', planSchema);

module.exports = Plan;
