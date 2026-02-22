// backend/src/routes/user.routes.js
const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  getMyProfile,
  updateProfile,
  updatePreferences,
  getDashboardStats,
  getUserResumes,
  getUserApplications,
  deleteAccount,
  uploadProfilePicture
} = require('../controllers/user.controller');
const { authenticate, optionalAuth } = require('../middlewares/auth.middleware');
const { ensureUserPlan } = require('../middlewares/planValidation.middleware');
const { paginationValidation } = require('../middlewares/validation.middleware');

// Public routes
router.get('/:id', optionalAuth, getUserProfile);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.get('/profile', ensureUserPlan, getMyProfile);
router.put('/profile', updateProfile);
router.put('/preferences', updatePreferences);
router.get('/dashboard/stats', ensureUserPlan, getDashboardStats);
router.get('/resumes/list', getUserResumes);
router.get('/applications/list', paginationValidation, getUserApplications);
router.delete('/account', deleteAccount);
router.post('/upload-picture', uploadProfilePicture);

module.exports = router;