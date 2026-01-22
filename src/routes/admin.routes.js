// backend/src/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Import admin controllers
const {
  getAllTemplatesAdmin,
  getTemplateById,
  createTemplate,
  updateTemplate,
  toggleTemplateStatus,
  deleteTemplate,
  duplicateTemplate,
  getTemplateAnalytics,
  bulkUpdateTemplates,
  getTemplateStatistics,
  uploadTemplateImage
} = require('../controllers/admin/adminTemplate.controller');

// Import master routes
const masterRoutes = require('./master.routes');

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

// Get single template
router.get('/templates/:id', getTemplateById);

// Get single template analytics
router.get('/templates/:id/analytics', getTemplateAnalytics);

// Create new template (with image upload)
router.post('/templates', uploadTemplateImage, createTemplate);

// Update template (with optional image upload)
router.put('/templates/:id', uploadTemplateImage, updateTemplate);

// Toggle template active status
router.patch('/templates/:id/toggle-status', toggleTemplateStatus);

// Duplicate template
router.post('/templates/:id/duplicate', duplicateTemplate);

// Bulk update templates
router.patch('/templates/bulk-update', bulkUpdateTemplates);

// Delete template
router.delete('/templates/:id', deleteTemplate);

// ============================================
// TEMPLATE RATING MANAGEMENT ROUTES
// ============================================

const {
  getAllRatings,
  moderateRating,
  toggleTemplateRating
} = require('../controllers/templateRating.controller');

// Get all template ratings
router.get('/template-ratings', getAllRatings);

// Moderate rating (approve/reject)
router.patch('/template-ratings/:id', moderateRating);

// Toggle rating enabled/disabled for template
router.patch('/templates/:id/rating-toggle', toggleTemplateRating);

// ============================================
// MASTER DATA MANAGEMENT ROUTES
// ============================================

// Mount master routes
router.use('/masters', masterRoutes);

// ============================================
// USER MANAGEMENT ROUTES
// ============================================

const {
  getAllUsers,
  getUserDetails,
  updateUserStatus,
  updateUserPlan,
  getUserStatistics
} = require('../controllers/admin/adminUser.controller');

router.get('/users', getAllUsers);
router.get('/users/statistics', getUserStatistics);
router.get('/users/:id', getUserDetails);
router.patch('/users/:id/status', updateUserStatus);
router.patch('/users/:id/plan', updateUserPlan);

// ============================================
// SUBSCRIPTION MANAGEMENT ROUTES
// ============================================

// const {
//   getAllSubscriptions,
//   getSubscriptionAnalytics,
//   updateSubscriptionPlan,
//   cancelUserSubscription,
//   getRevenueReport
// } = require('../controllers/admin/adminSubscription.controller');

// router.get('/subscriptions', getAllSubscriptions);
// router.get('/subscriptions/analytics', getSubscriptionAnalytics);
// router.get('/subscriptions/revenue', getRevenueReport);
// router.patch('/subscriptions/:id/plan', updateSubscriptionPlan);
// router.post('/subscriptions/:id/cancel', cancelUserSubscription);

// ============================================
// JOB MANAGEMENT ROUTES
// ============================================

// const {
//   getAllJobsAdmin,
//   getJobStatistics,
//   approveJob,
//   rejectJob,
//   deleteJob,
//   featureJob
// } = require('../controllers/admin/adminJob.controller');

// router.get('/jobs', getAllJobsAdmin);
// router.get('/jobs/statistics', getJobStatistics);
// router.patch('/jobs/:id/approve', approveJob);
// router.patch('/jobs/:id/reject', rejectJob);
// router.patch('/jobs/:id/feature', featureJob);
// router.delete('/jobs/:id', deleteJob);

// ============================================
// DASHBOARD & ANALYTICS ROUTES
// ============================================

// const {
//   getDashboardStats,
//   getRevenueAnalytics,
//   getUserGrowthAnalytics,
//   getTemplateUsageAnalytics
// } = require('../controllers/admin/adminDashboard.controller');

// router.get('/dashboard/stats', getDashboardStats);
// router.get('/analytics/revenue', getRevenueAnalytics);
// router.get('/analytics/user-growth', getUserGrowthAnalytics);
// router.get('/analytics/template-usage', getTemplateUsageAnalytics);

// ============================================
// PLAN MANAGEMENT ROUTES
// ============================================

const {
  getPlans,
  getPlanById,
  updatePlan
} = require('../controllers/admin/adminPlan.controller');

router.get('/plans', getPlans);
router.get('/plans/:id', getPlanById);
router.put('/plans/:id', updatePlan);

// ============================================
// SETTINGS MANAGEMENT ROUTES
// ============================================

const {
  getAllSettings,
  getSettingByKey,
  upsertSetting,
  updateSetting,
  deleteSetting,
  initResumeUrlSettings
} = require('../controllers/admin/adminSettings.controller');

router.get('/settings', getAllSettings);
router.get('/settings/init-resume-url', initResumeUrlSettings);
router.get('/settings/:key', getSettingByKey);
router.post('/settings', upsertSetting);
router.put('/settings/:key', updateSetting);
router.delete('/settings/:key', deleteSetting);

module.exports = router;