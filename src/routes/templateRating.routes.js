// backend/src/routes/templateRating.routes.js
const express = require('express');
const router = express.Router();
const {
  submitRating,
  getUserRating,
  getTemplateRatings
} = require('../controllers/templateRating.controller');
const { authenticate, optionalAuth } = require('../middlewares/auth.middleware');

// User routes
router.post('/', authenticate, submitRating);
router.get('/template/:templateId', authenticate, getUserRating);
router.get('/template/:templateId/all', optionalAuth, getTemplateRatings);

module.exports = router;
