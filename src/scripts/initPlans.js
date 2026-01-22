// backend/src/scripts/initPlans.js
// Script to initialize default FREE and PRO plans
const mongoose = require('mongoose');
require('dotenv').config();
const Plan = require('../models/Plan.model');

const initPlans = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // FREE Plan
    const freePlan = await Plan.findOneAndUpdate(
      { name: 'FREE' },
      {
        name: 'FREE',
        price: 0,
        billingCycle: 'monthly',
        isActive: true,
        features: {
          resumeCreateUnlimited: true,
          maxFreeTemplates: 5,
          premiumTemplatesAccess: false,
          resumeExportPdf: false,
          resumeExportHtml: false,
          resumeDownloadLimit: 0,
          resumeShareUrl: false,
          resumeUrlValidityDays: 0,
          autoApplyJobs: false,
          resumeAnalytics: false
        },
        description: 'Free plan with basic features - Create unlimited resumes, access to free templates'
      },
      { upsert: true, new: true }
    );
    console.log('✓ FREE plan initialized');

    // PRO Plan
    const proPlan = await Plan.findOneAndUpdate(
      { name: 'PRO' },
      {
        name: 'PRO',
        price: 999, // ₹999/month
        billingCycle: 'monthly',
        isActive: true,
        features: {
          resumeCreateUnlimited: true,
          maxFreeTemplates: 999,
          premiumTemplatesAccess: true,
          resumeExportPdf: true,
          resumeExportHtml: true,
          resumeDownloadLimit: 'unlimited',
          resumeShareUrl: true,
          resumeUrlValidityDays: 60, // 2 months
          autoApplyJobs: true,
          resumeAnalytics: true
        },
        description: 'Pro plan with all features - Unlimited resumes, premium templates, PDF/HTML export, URL sharing, auto-apply jobs, analytics'
      },
      { upsert: true, new: true }
    );
    console.log('✓ PRO plan initialized');

    console.log('\n✅ Plans initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing plans:', error);
    process.exit(1);
  }
};

initPlans();
