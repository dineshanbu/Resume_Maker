const Razorpay = require('razorpay');
const crypto = require('crypto');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User.model');
const Plan = require('../models/Plan.model');
const Payment = require('../models/Payment.model');
const {
    successResponse,
    badRequestResponse,
    errorResponse
} = require('../utils/apiResponse');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret'
});

/**
 * @desc    Create Razorpay Order
 * @route   POST /api/v1/payment/create-order
 * @access  Private
 */
const createOrder = asyncHandler(async (req, res) => {
    const { planId } = req.body;
    const userId = req.user._id;

    if (!planId) {
        return badRequestResponse(res, 'Plan ID is required');
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
        return badRequestResponse(res, 'Plan not found');
    }

    if (plan.price <= 0) {
        return badRequestResponse(res, 'Cannot create order for a free plan');
    }

    const options = {
        amount: plan.price * 100, // Amount in paise
        currency: 'INR',
        receipt: `rcpt_${userId.toString().slice(-4)}_${Date.now()}`,
        notes: {
            userId: userId.toString(),
            planId: planId.toString(),
            planName: plan.name
        }
    };

    try {
        const order = await razorpay.orders.create(options);

        // Optional: Update user with latest order ID
        await User.findByIdAndUpdate(userId, { razorpayOrderId: order.id });

        return successResponse(res, order, 'Razorpay order created successfully');
    } catch (error) {
        console.error('Razorpay Order Error:', error);
        // Include the actual error message from Razorpay for better debugging
        const errorMessage = error.error?.description || error.description || error.message || 'Failed to create Razorpay order';
        return errorResponse(res, errorMessage);
    }
});

/**
 * @desc    Verify Razorpay Payment Signature
 * @route   POST /api/v1/payment/verify
 * @access  Private
 */
const verifyPayment = asyncHandler(async (req, res) => {
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        planId
    } = req.body;
    const userId = req.user._id;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planId) {
        return badRequestResponse(res, 'All payment details are required');
    }

    // Verify Signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret')
        .update(body.toString())
        .digest('hex');

    const isSignatureValid = expectedSignature === razorpay_signature;

    if (!isSignatureValid) {
        return badRequestResponse(res, 'Invalid payment signature');
    }

    // Signature is valid, proceed with updating DB
    const plan = await Plan.findById(planId);
    if (!plan) {
        return badRequestResponse(res, 'Plan not found');
    }

    // Start Date and End Date
    const startDate = new Date();
    const endDate = new Date();
    if (plan.validityUnit === 'month') {
        endDate.setMonth(endDate.getMonth() + (plan.validity || 1));
    } else if (plan.validityUnit === 'year') {
        endDate.setFullYear(endDate.getFullYear() + (plan.validity || 1));
    } else {
        endDate.setDate(endDate.getDate() + (plan.validity || 30));
    }

    // 1. Update User with new subscription fields
    const updatedUser = await User.findByIdAndUpdate(userId, {
        planId: plan._id,
        subscriptionPlan: plan._id,
        planName: plan.name,
        currentPlan: plan.name === 'PRO' ? 'Premium' : plan.name,
        subscriptionType: 'PREMIUM',
        subscriptionStatus: 'premium',
        resumeLimit: plan.resumeLimit || -1,
        planStartDate: startDate,
        subscriptionStartDate: startDate,
        planExpiryDate: endDate,
        subscriptionEndDate: endDate,
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id
    }, { new: true });

    // 2. Store Payment
    await Payment.create({
        userId,
        planId: plan._id,
        amount: plan.price,
        currency: 'INR',
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        signature: razorpay_signature,
        paymentStatus: 'success'
    });

    return successResponse(res, {
        user: updatedUser.getPublicProfile(),
        message: 'Subscription updated successfully',
        redirectUrl: '/user/templates' // Hint for frontend to redirect
    }, 'Payment verified and subscription activated');
});

module.exports = {
    createOrder,
    verifyPayment
};
