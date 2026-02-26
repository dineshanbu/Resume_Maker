const Razorpay = require('razorpay');
const crypto = require('crypto');
const asyncHandler = require('../utils/asyncHandler');
const Plan = require('../models/Plan.model');
const Order = require('../models/Order.model');
const Payment = require('../models/Payment.model');
const Subscription = require('../models/Subscription.model');
const User = require('../models/User.model');
const {
  successResponse,
  createdResponse,
  notFoundResponse,
  badRequestResponse,
  errorResponse
} = require('../utils/apiResponse');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_SJBXPiBBPu4PAQ',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'QI0NNheZi0uuYY2NrgX1EnOb'
});

/**
 * @desc    Get all available plans
 * @route   GET /api/v1/subscriptions/plans
 * @access  Public
 */
exports.getAllPlans = asyncHandler(async (req, res) => {
  const plans = await Plan.find({ isActive: true }).sort({ price: 1 });
  return successResponse(res, { plans }, 'Subscription plans retrieved successfully');
});

/**
 * @desc    Get user's current subscription
 * @route   GET /api/v1/subscriptions/my-subscription
 * @access  Private
 */
exports.getMySubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({
    userId: req.user._id,
    status: 'active',
    endDate: { $gt: new Date() }
  }).populate('planId');

  return successResponse(res, {
    subscription,
    isActive: !!subscription
  });
});

/**
 * @desc    Create Razorpay order (Step 2 & 3)
 * @route   POST /api/v1/subscriptions/create-order
 * @access  Private
 */
exports.createPaymentOrder = asyncHandler(async (req, res) => {
  const { planId } = req.body;
  const userId = req.user._id;

  const plan = await Plan.findById(planId);
  if (!plan || !plan.isActive) {
    return notFoundResponse(res, 'Active subscription plan not found');
  }

  if (plan.price <= 0) {
    return badRequestResponse(res, 'Cannot create order for a free plan');
  }

  const options = {
    amount: plan.price * 100, // paise
    currency: plan.currency || 'INR',
    receipt: `rcpt_${userId.toString().slice(-4)}_${Date.now()}`
  };

  try {
    const rzpOrder = await razorpay.orders.create(options);

    // 3. Save Order in DB with status = created
    const order = await Order.create({
      userId,
      planId,
      razorpayOrderId: rzpOrder.id,
      amount: plan.price,
      currency: options.currency,
      status: 'created'
    });

    return createdResponse(res, {
      razorpayOrder: rzpOrder,
      orderId: order._id
    }, 'Payment order created successfully');
  } catch (error) {
    console.error('Razorpay Error:', error);
    return errorResponse(res, 'Failed to create payment order');
  }
});

/**
 * @desc    Verify payment and activate subscription (Step 5, 6, 7, 8)
 * @route   POST /api/v1/subscriptions/verify-payment
 * @access  Private
 */
exports.verifyPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderId
  } = req.body;
  const userId = req.user._id;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
    return badRequestResponse(res, 'Incomplete payment details');
  }

  const order = await Order.findById(orderId).populate('planId');
  if (!order || order.razorpayOrderId !== razorpay_order_id) {
    return notFoundResponse(res, 'Invalid order details');
  }

  // 5. Verify Signature
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret')
    .update(body.toString())
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    order.status = 'failed';
    await order.save();
    return badRequestResponse(res, 'Payment signature verification failed');
  }

  // 6. Update Order and Payment 
  order.status = 'completed';
  await order.save();

  const payment = await Payment.create({
    userId,
    orderId: order._id,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
    amount: order.amount,
    status: 'success'
  });

  // 7. Create Subscription Entry
  const plan = order.planId;
  const durationDays = plan.validity || 30; // default 30 days
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + durationDays);

  const subscription = await Subscription.create({
    userId,
    planId: plan._id,
    paymentId: payment._id,
    startDate: new Date(),
    endDate,
    status: 'active'
  });

  // 8. Update User role/access
  // Resolve legacy enums safely
  let legacyCurrentPlan = 'Premium';
  let legacyPlanName = 'PREMIUM';

  if (plan.name && plan.name.toLowerCase().includes('pro')) {
    legacyCurrentPlan = 'PRO';
    legacyPlanName = 'PRO';
  }

  await User.findByIdAndUpdate(userId, {
    currentPlan: legacyCurrentPlan,
    planId: plan._id,
    subscriptionPlan: plan._id,
    planName: legacyPlanName,
    subscriptionType: 'PREMIUM',
    subscriptionStatus: 'ACTIVE',
    planExpiryDate: endDate
  });

  return successResponse(res, {
    subscription,
    payment
  }, 'Payment verified and subscription activated successfully');
});

/**
 * @desc    Cancel subscription
 * @route   POST /api/v1/subscriptions/cancel
 * @access  Private
 */
exports.cancelSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({
    userId: req.user._id,
    status: 'active'
  });

  if (!subscription) {
    return notFoundResponse(res, 'No active subscription found');
  }

  subscription.status = 'cancelled';
  await subscription.save();

  await User.findByIdAndUpdate(req.user._id, {
    subscriptionStatus: 'cancelled'
  });

  return successResponse(res, null, 'Subscription cancelled successfully');
});

/**
 * @desc    Get payment history (Transactions)
 * @route   GET /api/v1/subscriptions/transactions
 * @access  Private
 */
exports.getTransactions = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ userId: req.user._id })
    .populate('orderId')
    .sort({ createdAt: -1 });

  return successResponse(res, { payments }, 'Transactions retrieved successfully');
});