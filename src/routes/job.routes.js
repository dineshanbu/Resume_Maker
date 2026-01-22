// backend/src/routes/job.routes.js
const express = require('express');
const router = express.Router();
const {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  changeJobStatus,
  getMyJobs,
  getJobStatistics,
  getJobViews,
  getRecommendedJobs,
  searchJobsByLocation,
  getFeaturedJobs
} = require('../controllers/job.controller');
const { authenticate, authorize, optionalAuth } = require('../middlewares/auth.middleware');
const {
  createJobValidation,
  updateJobValidation,
  idParamValidation,
  paginationValidation
} = require('../middlewares/validation.middleware');

// Public routes - literal routes first
router.get('/', paginationValidation, getAllJobs);
router.get('/featured', getFeaturedJobs);
router.get('/search/location', searchJobsByLocation);

// Protected routes for job seekers (before /:id to avoid conflicts)
router.get('/recommendations', authenticate, getRecommendedJobs);

// Public route for getting job by ID (using optionalAuth to allow both authenticated and unauthenticated access)
// This must come after specific literal routes but before router.use(authenticate)
router.get('/:id', optionalAuth, getJobById);

// Protected routes for employers (all routes below require authentication)
router.use(authenticate); // All routes below require authentication

router.post('/', authorize('employer', 'admin'), createJobValidation, createJob);
router.get('/employer/my-jobs', authorize('employer', 'admin'), getMyJobs);
router.get('/:id/statistics', authorize('employer', 'admin'), idParamValidation, getJobStatistics);
router.get('/:id/views', authorize('employer', 'admin'), idParamValidation, getJobViews);

// Protected routes for employers (CRUD operations)
router.put('/:id', authorize('employer', 'admin'), updateJobValidation, updateJob);
router.delete('/:id', authorize('employer', 'admin'), idParamValidation, deleteJob);
router.patch('/:id/status', authorize('employer', 'admin'), idParamValidation, changeJobStatus);

module.exports = router;