// backend/src/controllers/subscription.controller.js
const {
  SubscriptionPlan,
  UserSubscription,
  PaymentTransaction
} = require('../models/Subscription.model');
const User = require('../models/User.model');
const asyncHandler = require('../utils/asyncHandler');
const {
  successResponse,
  createdResponse,
  notFoundResponse,
  badRequestResponse
} = require('../utils/apiResponse');

/**
 * @desc    Get all subscription plans
 * @route   GET /api/v1/subscriptions/plans
 * @access  Public
 */
const getAllPlans = asyncHandler(async (req, res) => {
  const plans = await SubscriptionPlan.find({ isActive: true }).sort({ sortOrder: 1 });

  return successResponse(res, { plans }, 'Subscription plans retrieved successfully');
});

/**
 * @desc    Get user's current subscription
 * @route   GET /api/v1/subscriptions/my-subscription
 * @access  Private
 */
const getMySubscription = asyncHandler(async (req, res) => {
  let subscription = await UserSubscription.findOne({ userId: req.user._id });

  // If no subscription exists, create free subscription
  if (!subscription) {
    subscription = await UserSubscription.create({
      userId: req.user._id,
      planName: 'Free',
      endDate: new Date('2099-12-31') // Free plan never expires
    });
  }

  // Get plan details
  const plan = await SubscriptionPlan.findOne({ name: subscription.planName });

  return successResponse(res, {
    subscription,
    plan,
    isActive: subscription.isActive()
  });
});

/**
 * @desc    Create/Initiate payment order
 * @route   POST /api/v1/subscriptions/create-order
 * @access  Private
 */
const createPaymentOrder = asyncHandler(async (req, res) => {
  const { planName, billingCycle } = req.body;

  // Validate plan
  const plan = await SubscriptionPlan.findOne({ name: planName, isActive: true });
  if (!plan) {
    return notFoundResponse(res, 'Subscription plan not found');
  }

  // Calculate amount
  const amount = billingCycle === 'yearly'
    ? plan.pricing.yearly.amount
    : plan.pricing.monthly.amount;

  // Create transaction record
  const transactionId = `TXN${Date.now()}${Math.random().toString(36).substring(7)}`;

  const transaction = await PaymentTransaction.create({
    userId: req.user._id,
    transactionId,
    amount,
    currency: plan.pricing.monthly.currency,
    planName,
    billingCycle,
    status: 'pending',
    paymentGateway: 'razorpay'
  });

  // In production, integrate with Razorpay/Stripe
  // For now, return mock order
  const order = {
    orderId: transactionId,
    amount: amount * 100, // Convert to paise for Razorpay
    currency: 'INR',
    planName,
    billingCycle
  };

  return createdResponse(res, {
    order,
    transaction: transaction._id
  }, 'Payment order created successfully');
});

/**
 * @desc    Verify payment and activate subscription
 * @route   POST /api/v1/subscriptions/verify-payment
 * @access  Private
 */
const verifyPayment = asyncHandler(async (req, res) => {
  const {
    transactionId,
    paymentId,
    signature,
    orderId
  } = req.body;

  // Find transaction
  const transaction = await PaymentTransaction.findOne({ transactionId });
  if (!transaction) {
    return notFoundResponse(res, 'Transaction not found');
  }

  // In production, verify signature with Razorpay/Stripe
  // For now, assume payment is successful
  const paymentVerified = true;

  if (!paymentVerified) {
    transaction.status = 'failed';
    transaction.failureReason = 'Payment verification failed';
    await transaction.save();

    return badRequestResponse(res, 'Payment verification failed');
  }

  // Update transaction
  transaction.status = 'success';
  transaction.gatewayTransactionId = paymentId;
  transaction.gatewayOrderId = orderId;
  await transaction.save();

  // Create or update subscription
  const plan = await SubscriptionPlan.findOne({ name: transaction.planName });
  const duration = transaction.billingCycle === 'yearly' ? 365 : 30;
  const endDate = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);

  let subscription = await UserSubscription.findOne({ userId: req.user._id });

  if (subscription) {
    subscription.planName = transaction.planName;
    subscription.billingCycle = transaction.billingCycle;
    subscription.status = 'active';
    subscription.startDate = new Date();
    subscription.endDate = endDate;
    subscription.nextBillingDate = endDate;
    await subscription.save();
  } else {
    subscription = await UserSubscription.create({
      userId: req.user._id,
      planName: transaction.planName,
      billingCycle: transaction.billingCycle,
      status: 'active',
      endDate,
      nextBillingDate: endDate
    });
  }

  // Update user's current plan
  await User.findByIdAndUpdate(req.user._id, {
    currentPlan: transaction.planName
  });

  // Link transaction to subscription
  transaction.subscriptionId = subscription._id;
  await transaction.save();

  return successResponse(res, {
    subscription,
    transaction
  }, 'Payment verified and subscription activated successfully');
});

/**
 * @desc    Cancel subscription
 * @route   POST /api/v1/subscriptions/cancel
 * @access  Private
 */
const cancelSubscription = asyncHandler(async (req, res) => {
  const subscription = await UserSubscription.findOne({ userId: req.user._id });

  if (!subscription) {
    return notFoundResponse(res, 'No active subscription found');
  }

  if (subscription.planName === 'Free') {
    return badRequestResponse(res, 'Cannot cancel free plan');
  }

  await subscription.cancel();

  return successResponse(
    res,
    { subscription },
    'Subscription cancelled successfully. You can continue using premium features until the end of your billing period.'
  );
});

/**
 * @desc    Get subscription usage stats
 * @route   GET /api/v1/subscriptions/usage
 * @access  Private
 */
const getUsageStats = asyncHandler(async (req, res) => {
  let subscription = await UserSubscription.findOne({ userId: req.user._id });

  if (!subscription) {
    subscription = await UserSubscription.create({
      userId: req.user._id,
      planName: 'Free',
      endDate: new Date('2099-12-31')
    });
  }

  await subscription.resetMonthlyUsage();

  const plan = await SubscriptionPlan.findOne({ name: subscription.planName });

  const usage = {
    current: subscription.usage,
    limits: plan.features,
    planName: subscription.planName,
    billingCycle: subscription.billingCycle,
    nextResetDate: subscription.usage.lastResetDate
  };

  return successResponse(res, usage, 'Usage statistics retrieved successfully');
});

/**
 * @desc    Get payment history
 * @route   GET /api/v1/subscriptions/transactions
 * @access  Private
 */
const getTransactions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const transactions = await PaymentTransaction.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await PaymentTransaction.countDocuments({ userId: req.user._id });

  return successResponse(res, {
    transactions,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit)
    }
  });
});

/**
 * @desc    Check if user can use feature
 * @route   GET /api/v1/subscriptions/check-feature/:feature
 * @access  Private
 */
const checkFeatureAccess = asyncHandler(async (req, res) => {
  const { feature } = req.params;

  let subscription = await UserSubscription.findOne({ userId: req.user._id });

  if (!subscription) {
    subscription = await UserSubscription.create({
      userId: req.user._id,
      planName: 'Free',
      endDate: new Date('2099-12-31')
    });
  }

  const canUse = await subscription.canUseFeature(feature);
  const plan = await SubscriptionPlan.findOne({ name: subscription.planName });

  return successResponse(res, {
    canUse,
    feature,
    currentUsage: subscription.usage[feature] || 0,
    limit: plan.features[feature],
    planName: subscription.planName
  });
});

/**
 * @desc    Increment feature usage
 * @route   POST /api/v1/subscriptions/increment-usage/:feature
 * @access  Private
 */
const incrementFeatureUsage = asyncHandler(async (req, res) => {
  const { feature } = req.params;

  let subscription = await UserSubscription.findOne({ userId: req.user._id });

  if (!subscription) {
    return notFoundResponse(res, 'No subscription found');
  }

  const canUse = await subscription.canUseFeature(feature);

  if (!canUse) {
    return badRequestResponse(res, 'Feature limit reached. Please upgrade your plan.');
  }

  await subscription.incrementUsage(feature);

  return successResponse(
    res,
    { usage: subscription.usage },
    'Usage incremented successfully'
  );
});

// =============== ADMIN ROUTES ===============

/**
 * @desc    Create subscription plan (Admin)
 * @route   POST /api/v1/subscriptions/plans
 * @access  Private (Admin)
 */
const createPlan = asyncHandler(async (req, res) => {
  const plan = await SubscriptionPlan.create(req.body);

  return createdResponse(res, { plan }, 'Subscription plan created successfully');
});

/**
 * @desc    Update subscription plan (Admin)
 * @route   PUT /api/v1/subscriptions/plans/:id
 * @access  Private (Admin)
 */
const updatePlan = asyncHandler(async (req, res) => {
  const plan = await SubscriptionPlan.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!plan) {
    return notFoundResponse(res, 'Plan not found');
  }

  return successResponse(res, { plan }, 'Plan updated successfully');
});

module.exports = {
  getAllPlans,
  getMySubscription,
  createPaymentOrder,
  verifyPayment,
  cancelSubscription,
  getUsageStats,
  getTransactions,
  checkFeatureAccess,
  incrementFeatureUsage,
  createPlan,
  updatePlan
};