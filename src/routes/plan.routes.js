// backend/src/routes/plan.routes.js
const express = require('express');
const router = express.Router();
const { getPublicPlans, getPlanById } = require('../controllers/admin/adminPlan.controller');

// Public routes - no authentication required
router.get('/', getPublicPlans);
router.get('/:id', getPlanById);

module.exports = router;
