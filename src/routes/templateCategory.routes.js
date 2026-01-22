// backend/src/routes/templateCategory.routes.js
const express = require('express');
const router = express.Router();
const { getTemplateCategories } = require('../controllers/templateCategory.controller');

// Public route - no authentication required
router.get('/', getTemplateCategories);

module.exports = router;
