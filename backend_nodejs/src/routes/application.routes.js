// backend/src/routes/application.routes.js
const express = require('express');
const router = express.Router();
const {
  applyForJob,
  getMyApplications,
  getApplicationById,
  getJobApplications,
  updateApplicationStatus,
  withdrawApplication,
  scheduleInterview,
  addEmployerFeedback,
  toggleStarApplication,
  getApplicationStatistics
} = require('../controllers/application.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const {
  applyJobValidation,
  updateApplicationStatusValidation,
  idParamValidation,
  paginationValidation
} = require('../middlewares/validation.middleware');

// All routes require authentication
router.use(authenticate);

// Job seeker routes
router.post('/apply/:jobId', applyJobValidation, applyForJob);
router.get('/my-applications', paginationValidation, getMyApplications);
router.get('/statistics', getApplicationStatistics);
router.get('/:id', idParamValidation, getApplicationById);
router.patch('/:id/withdraw', idParamValidation, withdrawApplication);

// Employer routes
router.get('/job/:jobId', authorize('employer', 'admin'), paginationValidation, getJobApplications);
router.patch('/:id/status', authorize('employer', 'admin'), updateApplicationStatusValidation, updateApplicationStatus);
router.patch('/:id/schedule-interview', authorize('employer', 'admin'), idParamValidation, scheduleInterview);
router.patch('/:id/feedback', authorize('employer', 'admin'), idParamValidation, addEmployerFeedback);
router.patch('/:id/toggle-star', authorize('employer', 'admin'), idParamValidation, toggleStarApplication);

module.exports = router;