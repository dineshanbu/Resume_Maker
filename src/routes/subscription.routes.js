// backend/src/routes/subscription.routes.js
const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/subscription.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Public routes
router.get('/plans', getAllPlans);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.get('/my-subscription', getMySubscription);
router.get('/usage', getUsageStats);
router.get('/transactions', getTransactions);
router.get('/check-feature/:feature', checkFeatureAccess);
router.post('/increment-usage/:feature', incrementFeatureUsage);

// Payment routes
router.post('/create-order', createPaymentOrder);
router.post('/verify-payment', verifyPayment);
router.post('/cancel', cancelSubscription);

// Admin routes
router.post('/plans', authorize('admin'), createPlan);
router.put('/plans/:id', authorize('admin'), updatePlan);

module.exports = router;