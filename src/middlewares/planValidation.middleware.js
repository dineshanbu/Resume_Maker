const mongoose = require('mongoose');
const User = require('../models/User.model');
const Plan = require('../models/Plan.model');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Utility function to get FREE plan from DB (or create if missing)
 * @returns {Promise<Object>} FREE plan document
 */
async function getOrCreateFreePlan() {
  let freePlan = await Plan.findOne({ name: 'FREE', isActive: true });

  if (!freePlan) {
    console.warn('⚠️ FREE plan not found in DB. Creating default FREE plan...');
    freePlan = await Plan.create({
      name: 'FREE',
      price: 0,
      billingCycle: 'monthly',
      isActive: true,
      resumeLimit: 3, // Default: 3 resumes allowed
      maxFreeTemplates: 3, // Default: 3 distinct free templates
      features: {
        resumeCreateUnlimited: false, // Enforce limits
        premiumTemplatesAccess: false,
        resumeExportPdf: true,
        resumeExportHtml: false,
        resumeDownloadLimit: 0,
        resumeShareUrl: true,
        resumeUrlValidityDays: 1,
        autoApplyJobs: false,
        resumeAnalytics: false
      },
      description: 'Free plan with basic features'
    });
    console.log('✓ Default FREE plan created');
  }

  return freePlan;
}

/**
 * Ensure user has a valid planId assigned
 * If planId is missing, assign FREE plan
 * Also handles premium plan expiry (downgrade to FREE if expired)
 * 
 * This middleware should run AFTER authenticate middleware
 * It ensures planId is ALWAYS present before any business logic runs
 */
const ensureUserPlan = asyncHandler(async (req, res, next) => {
  // Skip if user not authenticated (optional auth routes)
  if (!req.user || !req.user._id) {
    return next();
  }

  const userId = req.user._id;
  let user = await User.findById(userId);

  if (!user) {
    return next(); // User not found - let other middleware handle it
  }

  let planUpdated = false;
  let currentPlan = null;

  // STEP 1: Check if user has planId
  if (!user.planId) {
    console.log(`⚠️ User ${userId} missing planId. Assigning FREE plan...`);

    // Get or create FREE plan
    const freePlan = await getOrCreateFreePlan();

    // Assign FREE plan to user
    user.planId = freePlan._id;
    user.planName = 'FREE';
    user.currentPlan = 'Free';
    user.planStartDate = new Date();
    user.planExpiryDate = null; // FREE plan has no expiry

    planUpdated = true;
    currentPlan = freePlan;
  } else {
    // STEP 2: Fetch plan from DB using planId
    currentPlan = await Plan.findById(user.planId);

    // If plan not found by ID, fallback to planName
    if (!currentPlan && user.planName) {
      currentPlan = await Plan.findOne({ name: user.planName, isActive: true });

      if (currentPlan) {
        // Update user.planId to match the found plan
        user.planId = currentPlan._id;
        planUpdated = true;
      }
    }

    // If still not found, assign FREE plan
    if (!currentPlan) {
      console.warn(`⚠️ Plan not found for user ${userId} (planId: ${user.planId}). Assigning FREE plan...`);

      const freePlan = await getOrCreateFreePlan();
      user.planId = freePlan._id;
      user.planName = 'FREE';
      user.currentPlan = 'Free';
      user.planStartDate = new Date();
      user.planExpiryDate = null;

      planUpdated = true;
      currentPlan = freePlan;
    }
  }

  // STEP 3: Check premium plan expiry (only for PRO/PREMIUM plans)
  if (currentPlan && currentPlan.name === 'PRO' && user.planExpiryDate) {
    const now = new Date();
    const expiryDate = new Date(user.planExpiryDate);

    if (now > expiryDate) {
      console.log(`⚠️ Premium plan expired for user ${userId}. Downgrading to FREE...`);

      // Downgrade to FREE plan
      const freePlan = await getOrCreateFreePlan();

      user.planId = freePlan._id;
      user.planName = 'FREE';
      user.currentPlan = 'Free';
      user.planStartDate = new Date();
      user.planExpiryDate = null; // Remove expiry for FREE plan

      planUpdated = true;
      currentPlan = freePlan;
    }
  }

  // STEP 6: Synchronize new subscription fields
  if (currentPlan) {
    const isPremium = currentPlan.name === 'PRO' || currentPlan.name === 'PREMIUM';
    const status = isPremium ? 'premium' : 'free';

    if (user.subscriptionStatus !== status) {
      user.subscriptionStatus = status;
      planUpdated = true;
    }

    if (!user.subscriptionPlan || user.subscriptionPlan.toString() !== currentPlan._id.toString()) {
      user.subscriptionPlan = currentPlan._id;
      planUpdated = true;
    }

    if (!user.subscriptionStartDate) {
      user.subscriptionStartDate = user.planStartDate || new Date();
      planUpdated = true;
    }

    if (user.subscriptionEndDate !== user.planExpiryDate) {
      user.subscriptionEndDate = user.planExpiryDate;
      planUpdated = true;
    }
  }

  // STEP 7: Count actual resumes if resumesCreated is out of sync (optional optimization)
  const actualCount = await mongoose.model('Resume').countDocuments({ userId: user._id });
  if (user.resumesCreated !== actualCount) {
    user.resumesCreated = actualCount;
    planUpdated = true;
  }

  // STEP 8: Save user if plan was updated
  if (planUpdated) {
    await user.save();
    console.log(`✓ User ${userId} plan synchronized: status=${user.subscriptionStatus}`);

    // Update req.user with fresh data including populated plan
    req.user = await User.findById(userId).select('-password').populate('subscriptionPlan');
  }

  // STEP 9: Attach plan to request for use in controllers
  req.userPlan = currentPlan;
  req.userPlanName = user.planName;

  next();
});

/**
 * Get user's plan with validation (utility function for controllers)
 * This is a fallback if middleware wasn't used
 */
async function getUserPlan(user) {
  if (!user) {
    throw new Error('User is required');
  }

  // If user has planId, use it
  if (user.planId) {
    const plan = await Plan.findById(user.planId);
    if (plan) {
      return plan;
    }
  }

  // Fallback to planName
  if (user.planName) {
    const plan = await Plan.findOne({ name: user.planName, isActive: true });
    if (plan) {
      return plan;
    }
  }

  // Default to FREE plan
  return await getOrCreateFreePlan();
}

module.exports = {
  ensureUserPlan,
  getOrCreateFreePlan,
  getUserPlan
};
