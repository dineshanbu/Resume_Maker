// backend/src/controllers/templateCategory.controller.js
const TemplateCategory = require('../models/TemplateCategory.model');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/apiResponse');

/**
 * @desc    Get all active template categories
 * @route   GET /api/v1/template-categories
 * @access  Public
 */
const getTemplateCategories = asyncHandler(async (req, res) => {
  const { status = 'Active' } = req.query;

  const query = {};
  if (status) {
    query.status = status;
  }

  const categories = await TemplateCategory.find(query)
    .sort({ name: 1 })
    .select('_id name status createdAt updatedAt');

  return successResponse(res, {
    categories,
    count: categories.length
  }, 'Template categories retrieved successfully');
});

module.exports = {
  getTemplateCategories
};
