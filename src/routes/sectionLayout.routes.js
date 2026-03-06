const express = require('express');
const router = express.Router();
const { getActiveLayoutsByType } = require('../controllers/admin/sectionLayout.controller');

// GET /api/v1/section-layouts/:sectionType
router.get('/:sectionType', getActiveLayoutsByType);

module.exports = router;
