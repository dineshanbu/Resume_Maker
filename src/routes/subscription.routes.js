// backend/src/routes/subscription.routes.js
const express = require('express');
const router = express.Router();
const {
  getAllPlans,
  getMySubscription,
  createPaymentOrder,
  verifyPayment,
  cancelSubscription,
  getTransactions
} = require('../controllers/subscription.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Public routes
router.get('/plans', getAllPlans);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.get('/my-subscription', getMySubscription);
router.get('/transactions', getTransactions);

// Payment routes
router.post('/create-order', createPaymentOrder);
router.post('/verify-payment', verifyPayment);
router.post('/cancel', cancelSubscription);

module.exports = router;