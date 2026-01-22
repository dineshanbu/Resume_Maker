// backend/src/routes/profile.routes.js
const express = require('express');
const router = express.Router();
const {
  getProfile,
  saveProfile,
  saveProfileSection,
  uploadPhoto,
  uploadResume
} = require('../controllers/profile.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { profileValidation } = require('../middlewares/profile.validation.middleware');

// All profile routes require authentication
router.use(authenticate);

// Profile CRUD routes
router.get('/', getProfile);
router.post('/', profileValidation, saveProfile);
router.put('/', profileValidation, saveProfile);

// Section-wise profile update routes (Naukri-style)
router.post('/section/:sectionName', saveProfileSection);
router.put('/section/:sectionName', saveProfileSection);

// File upload routes
router.post('/upload-photo', uploadPhoto);
router.post('/upload-resume', uploadResume);

module.exports = router;
