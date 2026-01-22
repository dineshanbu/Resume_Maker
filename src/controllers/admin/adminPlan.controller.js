// backend/src/controllers/admin/adminPlan.controller.js
const Plan = require('../../models/Plan.model');
const asyncHandler = require('../../utils/asyncHandler');
const {
  successResponse,
  badRequestResponse,
  notFoundResponse,
  errorResponse
} = require('../../utils/apiResponse');

/**
 * @desc    Get all plans (public endpoint for pricing page)
 * @route   GET /api/v1/plans
 * @access  Public
 */
const getPublicPlans = asyncHandler(async (req, res) => {
  const plans = await Plan.find({ isActive: true }).sort({ price: 1 });
  
  return successResponse(res, { plans }, 'Plans retrieved successfully');
});

/**
 * @desc    Get all plans (admin endpoint)
 * @route   GET /api/admin/plans
 * @access  Private/Admin
 */
const getPlans = asyncHandler(async (req, res) => {
  const plans = await Plan.find().sort({ price: 1 });
  
  return successResponse(res, { plans }, 'Plans retrieved successfully');
});

/**
 * @desc    Get single plan by ID
 * @route   GET /api/v1/plans/:id (public) or GET /api/admin/plans/:id (admin)
 * @access  Public (for /api/v1/plans/:id) or Private/Admin (for /api/admin/plans/:id)
 */
const getPlanById = asyncHandler(async (req, res) => {
  const plan = await Plan.findById(req.params.id);
  
  if (!plan) {
    return notFoundResponse(res, 'Plan not found');
  }
  
  // For public endpoint (when user is not admin), only return active plans
  // Admin endpoint can return any plan (including inactive)
  const isAdmin = req.user && req.user.role === 'admin';
  if (!isAdmin && !plan.isActive) {
    return notFoundResponse(res, 'Plan not found');
  }
  
  return successResponse(res, { plan }, 'Plan retrieved successfully');
});

/**
 * @desc    Update plan
 * @route   PUT /api/admin/plans/:id
 * @access  Private/Admin
 */
const updatePlan = asyncHandler(async (req, res) => {
  const { price, billingCycle, isActive, features, description } = req.body;
  
  const plan = await Plan.findById(req.params.id);
  
  if (!plan) {
    return notFoundResponse(res, 'Plan not found');
  }
  
  // Prevent changing name of default plans
  if (req.body.name && req.body.name !== plan.name) {
    if (plan.name === 'FREE' || plan.name === 'PRO') {
      return badRequestResponse(res, 'Cannot change name of default plans (FREE or PRO)');
    }
  }
  
  // Update allowed fields
  if (price !== undefined) plan.price = price;
  if (billingCycle !== undefined) plan.billingCycle = billingCycle;
  if (isActive !== undefined) plan.isActive = isActive;
  if (description !== undefined) plan.description = description;
  
  // Update features if provided
  if (features) {
    Object.keys(features).forEach(key => {
      if (plan.features[key] !== undefined) {
        plan.features[key] = features[key];
      }
    });
  }
  
  await plan.save();
  
  return successResponse(res, { plan }, 'Plan updated successfully');
});

module.exports = {
  getPublicPlans,
  getPlans,
  getPlanById,
  updatePlan
};
