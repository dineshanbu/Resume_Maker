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

// Public routes
router.get('/', paginationValidation, getAllJobs);
router.get('/featured', getFeaturedJobs);
router.get('/search/location', searchJobsByLocation);
router.get('/:id', optionalAuth, getJobById);

// Protected routes for job seekers
router.get('/recommendations', authenticate, getRecommendedJobs);

// Protected routes for employers
router.use(authenticate); // All routes below require authentication

router.post('/', authorize('employer', 'admin'), createJobValidation, createJob);
router.get('/employer/my-jobs', authorize('employer', 'admin'), getMyJobs);
router.get('/:id/statistics', authorize('employer', 'admin'), idParamValidation, getJobStatistics);
router.put('/:id', authorize('employer', 'admin'), updateJobValidation, updateJob);
router.delete('/:id', authorize('employer', 'admin'), idParamValidation, deleteJob);
router.patch('/:id/status', authorize('employer', 'admin'), idParamValidation, changeJobStatus);

module.exports = router;