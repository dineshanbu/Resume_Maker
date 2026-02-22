const Plan = require('../models/Plan.model');
const asyncHandler = require('../utils/asyncHandler');
const {
    successResponse,
    notFoundResponse,
    badRequestResponse,
    createdResponse
} = require('../utils/apiResponse');

/**
 * @desc    Create a new plan
 * @route   POST /api/v1/admin/plans
 * @access  Admin
 */
const createPlan = asyncHandler(async (req, res) => {
    const {
        name,
        price,
        validity,
        validityUnit,
        maxResumeDownloads,
        maxFreeTemplates,
        featuresChecklist,
        description,
        billingCycle
    } = req.body;

    const existingPlan = await Plan.findOne({ name });
    if (existingPlan) {
        return badRequestResponse(res, `Plan with name ${name} already exists`);
    }

    const plan = await Plan.create({
        name,
        price,
        validity,
        validityUnit,
        maxResumeDownloads,
        maxFreeTemplates,
        featuresChecklist,
        description,
        billingCycle,
        status: 'Active'
    });

    return createdResponse(res, plan, 'Plan created successfully');
});

/**
 * @desc    Get all plans (including inactive ones)
 * @route   GET /api/v1/admin/plans
 * @access  Admin
 */
const getAllPlans = asyncHandler(async (req, res) => {
    const plans = await Plan.find().sort({ price: 1 });
    return successResponse(res, { plans });
});

/**
 * @desc    Get single plan
 * @route   GET /api/v1/admin/plans/:id
 * @access  Admin
 */
const getPlanById = asyncHandler(async (req, res) => {
    const plan = await Plan.findById(req.params.id);
    if (!plan) {
        return notFoundResponse(res, 'Plan not found');
    }
    return successResponse(res, plan);
});

/**
 * @desc    Update a plan
 * @route   PUT /api/v1/admin/plans/:id
 * @access  Admin
 */
const updatePlan = asyncHandler(async (req, res) => {
    const plan = await Plan.findById(req.params.id);
    if (!plan) {
        return notFoundResponse(res, 'Plan not found');
    }

    // Update fields
    const updateData = { ...req.body };

    // Prevent name change for FREE plan to maintain system integrity
    if (plan.name === 'FREE' && updateData.name && updateData.name !== 'FREE') {
        return badRequestResponse(res, 'Cannot change the name of the FREE plan');
    }

    const updatedPlan = await Plan.findByIdAndUpdate(
        req.params.id,
        { $set: updateData },
        { new: true, runValidators: true }
    );

    return successResponse(res, updatedPlan, 'Plan updated successfully');
});

/**
 * @desc    Delete a plan
 * @route   DELETE /api/v1/admin/plans/:id
 * @access  Admin
 */
const deletePlan = asyncHandler(async (req, res) => {
    const plan = await Plan.findById(req.params.id);
    if (!plan) {
        return notFoundResponse(res, 'Plan not found');
    }

    if (plan.name === 'FREE') {
        return badRequestResponse(res, 'Cannot delete the FREE plan');
    }

    await Plan.findByIdAndDelete(req.params.id);
    return successResponse(res, null, 'Plan deleted successfully');
});

/**
 * @desc    Toggle plan status (Active/Inactive)
 * @route   PATCH /api/v1/admin/plans/:id/toggle-status
 * @access  Admin
 */
const togglePlanStatus = asyncHandler(async (req, res) => {
    const plan = await Plan.findById(req.params.id);
    if (!plan) {
        return notFoundResponse(res, 'Plan not found');
    }

    plan.status = plan.status === 'Active' ? 'Inactive' : 'Active';
    plan.isActive = plan.status === 'Active';
    await plan.save();

    return successResponse(res, plan, `Plan marked as ${plan.status}`);
});

module.exports = {
    createPlan,
    getAllPlans,
    getPlanById,
    updatePlan,
    deletePlan,
    togglePlanStatus
};
