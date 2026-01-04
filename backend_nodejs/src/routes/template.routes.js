// backend/src/routes/template.routes.js
const express = require('express');
const router = express.Router();
const {
  getAllTemplates,
  getTemplatesByProfession,
  getTemplateById,
  getTemplatePreview,
  useTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  rateTemplate
} = require('../controllers/template.controller');
const { authenticate, authorize, optionalAuth } = require('../middlewares/auth.middleware');

// Public routes
router.get('/', optionalAuth, getAllTemplates);
router.get('/profession/:profession', optionalAuth, getTemplatesByProfession);
router.get('/:id', optionalAuth, getTemplateById);
router.get('/:id/preview', getTemplatePreview);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.post('/:id/use', useTemplate);
router.post('/:id/rate', rateTemplate);

// Admin routes
router.post('/', authorize('admin'), createTemplate);
router.put('/:id', authorize('admin'), updateTemplate);
router.delete('/:id', authorize('admin'), deleteTemplate);

module.exports = router;