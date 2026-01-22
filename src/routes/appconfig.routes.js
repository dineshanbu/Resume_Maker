// backend/src/routes/appconfig.routes.js
const express = require('express');
const router = express.Router();
const { getAppConfig } = require('../controllers/appconfig.controller');

// Public route - no authentication required
router.get('/', getAppConfig);

module.exports = router;
