// backend/src/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Import admin controllers
const {
  getAllTemplatesAdmin,
  createTemplate,
  updateTemplate,
  toggleTemplateStatus,
  deleteTemplate,
  duplicateTemplate,
  getTemplateAnalytics,
  bulkUpdateTemplates,
  getTemplateStatistics
} = require('../controllers/admin/adminTemplate.controller');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// ============================================
// TEMPLATE MANAGEMENT ROUTES
// ============================================

// Get all templates (admin view)
router.get('/templates', getAllTemplatesAdmin);

// Get template statistics
router.get('/templates/statistics', getTemplateStatistics);

// Get single template analytics
router.get('/templates/:id/analytics', getTemplateAnalytics);

// Create new template
router.post('/templates', createTemplate);

// Update template
router.put('/templates/:id', updateTemplate);

// Toggle template active status
router.patch('/templates/:id/toggle-status', toggleTemplateStatus);

// Duplicate template
router.post('/templates/:id/duplicate', duplicateTemplate);

// Bulk update templates
router.patch('/templates/bulk-update', bulkUpdateTemplates);

// Delete template
router.delete('/templates/:id', deleteTemplate);

// ============================================
// USER MANAGEMENT ROUTES
// ============================================

const {
  getAllUsers,
  getUserDetails,
  updateUserRole,
  suspendUser,
  deleteUser,
  getUserStatistics
} = require('../controllers/admin/adminUser.controller');

router.get('/users', getAllUsers);
router.get('/users/statistics', getUserStatistics);
router.get('/users/:id', getUserDetails);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/suspend', suspendUser);
router.delete('/users/:id', deleteUser);

// ============================================
// SUBSCRIPTION MANAGEMENT ROUTES
// ============================================

const {
  getAllSubscriptions,
  getSubscriptionAnalytics,
  updateSubscriptionPlan,
  cancelUserSubscription,
  getRevenueReport
} = require('../controllers/admin/adminSubscription.controller');

router.get('/subscriptions', getAllSubscriptions);
router.get('/subscriptions/analytics', getSubscriptionAnalytics);
router.get('/subscriptions/revenue', getRevenueReport);
router.patch('/subscriptions/:id/plan', updateSubscriptionPlan);
router.post('/subscriptions/:id/cancel', cancelUserSubscription);

// ============================================
// JOB MANAGEMENT ROUTES
// ============================================

const {
  getAllJobsAdmin,
  getJobStatistics,
  approveJob,
  rejectJob,
  deleteJob,
  featureJob
} = require('../controllers/admin/adminJob.controller');

router.get('/jobs', getAllJobsAdmin);
router.get('/jobs/statistics', getJobStatistics);
router.patch('/jobs/:id/approve', approveJob);
router.patch('/jobs/:id/reject', rejectJob);
router.patch('/jobs/:id/feature', featureJob);
router.delete('/jobs/:id', deleteJob);

// ============================================
// DASHBOARD & ANALYTICS ROUTES
// ============================================

const {
  getDashboardStats,
  getRevenueAnalytics,
  getUserGrowthAnalytics,
  getTemplateUsageAnalytics
} = require('../controllers/admin/adminDashboard.controller');

router.get('/dashboard/stats', getDashboardStats);
router.get('/analytics/revenue', getRevenueAnalytics);
router.get('/analytics/user-growth', getUserGrowthAnalytics);
router.get('/analytics/template-usage', getTemplateUsageAnalytics);

module.exports = router;