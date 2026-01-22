// backend/src/routes/resume.routes.js
const express = require('express');
const router = express.Router();
const {
  createResume,
  getMyResumes,
  getResumeById,
  updateResume,
  deleteResume,
  toggleResumePublic,
  duplicateResume,
  downloadResumePDF,
  getResumeStats,
  updateResumeSection,
  exportResumeUrl,
  getPublicResume
} = require('../controllers/resume.controller');
const { authenticate, optionalAuth } = require('../middlewares/auth.middleware');
const {
  createResumeValidation,
  updateResumeValidation,
  idParamValidation
} = require('../middlewares/validation.middleware');
const { ensureUserPlan } = require('../middlewares/planValidation.middleware');

// Protected routes only
router.use(authenticate);
// Ensure all authenticated users have valid planId (fixes missing planId for existing users)
router.use(ensureUserPlan);

// Resume CRUD
router.post('/', createResumeValidation, createResume);
router.get('/', getMyResumes);
router.get('/:id', optionalAuth, getResumeById);
router.put('/:id', updateResumeValidation, updateResume);
router.delete('/:id', idParamValidation, deleteResume);

// Resume actions
router.patch('/:id/toggle-public', idParamValidation, toggleResumePublic);
router.post('/:id/duplicate', idParamValidation, duplicateResume);
router.post('/:id/export-url', idParamValidation, exportResumeUrl);
router.get('/:id/download-pdf', idParamValidation, downloadResumePDF);
router.get('/:id/stats', idParamValidation, getResumeStats);
router.patch('/:id/section/:section', updateResumeSection);

module.exports = router;