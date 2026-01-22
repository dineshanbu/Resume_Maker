// backend/src/routes/master.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const {
  getAllMasters,
  getMasterById,
  createMaster,
  updateMaster,
  toggleMasterStatus,
  deleteMaster,
  bulkUploadMasters,
  bulkDeleteMasters,
  bulkToggleStatusMasters,
  testEmailTemplate
} = require('../controllers/admin/master.controller');

// All master routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Bulk upload CSV (must come before :id routes)
router.post('/:type/bulk-upload', bulkUploadMasters);

// Bulk delete (must come before :id routes) - using POST to accept body
router.post('/:type/bulk-delete', bulkDeleteMasters);

// Bulk toggle status (must come before :id routes)
router.post('/:type/bulk-toggle-status', bulkToggleStatusMasters);

// Test email template (specific route for email-templates)
router.post('/email-templates/test', testEmailTemplate);

// Get all items for a master type
router.get('/:type', getAllMasters);

// Create new item
router.post('/:type', createMaster);

// Toggle status (must come before :id route to avoid conflict)
router.patch('/:type/:id/status', toggleMasterStatus);

// Get single item by ID
router.get('/:type/:id', getMasterById);

// Update item
router.put('/:type/:id', updateMaster);

// Delete item
router.delete('/:type/:id', deleteMaster);

module.exports = router;
