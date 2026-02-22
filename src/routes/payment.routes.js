const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment } = require('../controllers/payment.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// All payment routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/payment/create-order
 * @desc    Create a Razorpay order
 */
router.post('/create-order', createOrder);

/**
 * @route   POST /api/v1/payment/verify
 * @desc    Verify Razorpay payment signature
 */
router.post('/verify', verifyPayment);

module.exports = router;
