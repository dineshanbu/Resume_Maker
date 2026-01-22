// backend/src/routes/publicResume.routes.js
const express = require('express');
const router = express.Router();
const { getPublicResume } = require('../controllers/resume.controller');

// Public route - no authentication required
router.get('/:token', getPublicResume);

module.exports = router;
