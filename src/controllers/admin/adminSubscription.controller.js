const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../utils/apiResponse');
const Plan = require('../../models/Plan.model');
const Order = require('../../models/Order.model');
const Payment = require('../../models/Payment.model');
const Subscription = require('../../models/Subscription.model');
const User = require('../../models/User.model');

// ==========================================
// PLANS
// ==========================================
exports.getAdminPlans = asyncHandler(async (req, res) => {
    const plans = await Plan.find().sort({ price: 1 });
    return successResponse(res, plans, 'Plans retrieved successfully');
});

exports.createAdminPlan = asyncHandler(async (req, res) => {
    const plan = await Plan.create(req.body);
    return successResponse(res, plan, 'Plan created successfully', 201);
});

exports.updateAdminPlan = asyncHandler(async (req, res) => {
    const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!plan) return errorResponse(res, 'Plan not found', 404);
    return successResponse(res, plan, 'Plan updated successfully');
});

exports.toggleAdminPlanStatus = asyncHandler(async (req, res) => {
    const plan = await Plan.findById(req.params.id);
    if (!plan) return errorResponse(res, 'Plan not found', 404);

    plan.isActive = !plan.isActive;
    plan.status = plan.isActive ? 'Active' : 'Inactive';
    await plan.save();

    return successResponse(res, plan, 'Plan status toggled successfully');
});

exports.deleteAdminPlan = asyncHandler(async (req, res) => {
    const plan = await Plan.findById(req.params.id);
    if (!plan) return errorResponse(res, 'Plan not found', 404);

    if (['FREE', 'PREMIUM', 'PRO'].includes(plan.name.toUpperCase())) {
        plan.isActive = false;
        plan.status = 'Inactive';
        await plan.save();
        return successResponse(res, plan, 'Default plan deactivated instead of deleted');
    }

    await plan.deleteOne();
    return successResponse(res, null, 'Plan deleted successfully');
});

// ==========================================
// ORDERS
// ==========================================
exports.getAdminOrders = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    const orders = await Order.find()
        .populate('userId', 'fullName email')
        .populate('planId', 'name price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Order.countDocuments();
    return successResponse(res, { orders, total, page, limit }, 'Orders retrieved successfully');
});

// ==========================================
// PAYMENTS
// ==========================================
exports.getAdminPayments = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    const payments = await Payment.find()
        .populate('userId', 'fullName email')
        .populate('orderId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Payment.countDocuments();
    return successResponse(res, { payments, total, page, limit }, 'Payments retrieved successfully');
});

// ==========================================
// SUBSCRIPTIONS
// ==========================================
exports.getAdminSubscriptions = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    const subscriptions = await Subscription.find()
        .populate('userId', 'fullName email')
        .populate('planId', 'name')
        .populate('paymentId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Subscription.countDocuments();
    return successResponse(res, { subscriptions, total, page, limit }, 'Subscriptions retrieved successfully');
});

// ==========================================
// USERS WITH PLAN
// ==========================================
exports.getUsersWithPlan = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    const users = await User.find({ role: { $ne: 'admin' }, currentPlan: { $exists: true, $ne: null } })
        .populate('currentPlan', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-password');

    const total = await User.countDocuments({ role: { $ne: 'admin' }, currentPlan: { $exists: true, $ne: null } });
    return successResponse(res, { users, total, page, limit }, 'Users with plan retrieved successfully');
});
