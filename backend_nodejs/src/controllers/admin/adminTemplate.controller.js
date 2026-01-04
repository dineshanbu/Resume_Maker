// backend/src/controllers/admin/adminTemplate.controller.js
const Template = require('../../models/Template.model');
const asyncHandler = require('../../utils/asyncHandler');
const {
  successResponse,
  createdResponse,
  notFoundResponse
} = require('../../utils/apiResponse');

/**
 * @desc    Get all templates (Admin view)
 * @route   GET /api/v1/admin/templates
 * @access  Private (Admin only)
 */
const getAllTemplatesAdmin = asyncHandler(async (req, res) => {
  const {
    status,
    profession,
    tier,
    page = 1,
    limit = 20,
    search
  } = req.query;

  // Build query
  const query = {};
  
  if (status === 'active') query.isActive = true;
  if (status === 'inactive') query.isActive = false;
  if (profession) query.profession = profession;
  if (tier) query.subscriptionTier = tier;
  if (search) {
    query.$or = [
      { name: new RegExp(search, 'i') },
      { displayName: new RegExp(search, 'i') }
    ];
  }

  const skip = (page - 1) * limit;

  const templates = await Template.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Template.countDocuments(query);

  // Get statistics
  const stats = {
    total: await Template.countDocuments(),
    active: await Template.countDocuments({ isActive: true }),
    inactive: await Template.countDocuments({ isActive: false }),
    free: await Template.countDocuments({ subscriptionTier: 'free' }),
    basic: await Template.countDocuments({ subscriptionTier: 'basic' }),
    premium: await Template.countDocuments({ subscriptionTier: 'premium' })
  };

  return successResponse(res, {
    templates,
    stats,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit)
    }
  });
});

/**
 * @desc    Create new template
 * @route   POST /api/v1/admin/templates
 * @access  Private (Admin only)
 */
const createTemplate = asyncHandler(async (req, res) => {
  const templateData = req.body;

  // Validate required fields
  if (!templateData.name || !templateData.displayName) {
    return res.status(400).json({
      success: false,
      message: 'Template name and display name are required'
    });
  }

  // Check if template with same name exists
  const existingTemplate = await Template.findOne({ name: templateData.name });
  if (existingTemplate) {
    return res.status(409).json({
      success: false,
      message: 'Template with this name already exists'
    });
  }

  // Create template
  const template = await Template.create({
    ...templateData,
    createdBy: req.user._id
  });

  return createdResponse(res, { template }, 'Template created successfully');
});

/**
 * @desc    Update template
 * @route   PUT /api/v1/admin/templates/:id
 * @access  Private (Admin only)
 */
const updateTemplate = asyncHandler(async (req, res) => {
  const template = await Template.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );

  if (!template) {
    return notFoundResponse(res, 'Template not found');
  }

  return successResponse(res, { template }, 'Template updated successfully');
});

/**
 * @desc    Toggle template status (Active/Inactive)
 * @route   PATCH /api/v1/admin/templates/:id/toggle-status
 * @access  Private (Admin only)
 */
const toggleTemplateStatus = asyncHandler(async (req, res) => {
  const template = await Template.findById(req.params.id);

  if (!template) {
    return notFoundResponse(res, 'Template not found');
  }

  template.isActive = !template.isActive;
  await template.save();

  return successResponse(
    res,
    { template },
    `Template ${template.isActive ? 'activated' : 'deactivated'} successfully`
  );
});

/**
 * @desc    Delete template
 * @route   DELETE /api/v1/admin/templates/:id
 * @access  Private (Admin only)
 */
const deleteTemplate = asyncHandler(async (req, res) => {
  const template = await Template.findByIdAndDelete(req.params.id);

  if (!template) {
    return notFoundResponse(res, 'Template not found');
  }

  return successResponse(res, null, 'Template deleted successfully');
});

/**
 * @desc    Duplicate template
 * @route   POST /api/v1/admin/templates/:id/duplicate
 * @access  Private (Admin only)
 */
const duplicateTemplate = asyncHandler(async (req, res) => {
  const originalTemplate = await Template.findById(req.params.id);

  if (!originalTemplate) {
    return notFoundResponse(res, 'Template not found');
  }

  // Create duplicate
  const templateData = originalTemplate.toObject();
  delete templateData._id;
  delete templateData.createdAt;
  delete templateData.updatedAt;
  delete templateData.usageCount;
  delete templateData.rating;

  templateData.name = `${originalTemplate.name}-copy-${Date.now()}`;
  templateData.displayName = `${originalTemplate.displayName} (Copy)`;
  templateData.isActive = false;

  const duplicatedTemplate = await Template.create(templateData);

  return createdResponse(
    res,
    { template: duplicatedTemplate },
    'Template duplicated successfully'
  );
});

/**
 * @desc    Get template analytics
 * @route   GET /api/v1/admin/templates/:id/analytics
 * @access  Private (Admin only)
 */
const getTemplateAnalytics = asyncHandler(async (req, res) => {
  const template = await Template.findById(req.params.id);

  if (!template) {
    return notFoundResponse(res, 'Template not found');
  }

  // Get resume count using this template
  const Resume = require('../../models/Resume.model');
  const resumeCount = await Resume.countDocuments({
    templateId: template._id
  });

  // Get usage by date (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentUsage = await Resume.aggregate([
    {
      $match: {
        templateId: template._id,
        createdAt: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const analytics = {
    template: {
      id: template._id,
      name: template.displayName,
      usageCount: template.usageCount,
      rating: template.rating,
      isActive: template.isActive
    },
    resumeCount,
    recentUsage,
    averageRating: template.rating.average,
    totalRatings: template.rating.count
  };

  return successResponse(res, analytics, 'Analytics retrieved successfully');
});

/**
 * @desc    Bulk update templates
 * @route   PATCH /api/v1/admin/templates/bulk-update
 * @access  Private (Admin only)
 */
const bulkUpdateTemplates = asyncHandler(async (req, res) => {
  const { templateIds, updates } = req.body;

  if (!templateIds || !Array.isArray(templateIds)) {
    return res.status(400).json({
      success: false,
      message: 'Template IDs array is required'
    });
  }

  const result = await Template.updateMany(
    { _id: { $in: templateIds } },
    { $set: updates }
  );

  return successResponse(
    res,
    { modifiedCount: result.modifiedCount },
    `${result.modifiedCount} templates updated successfully`
  );
});

/**
 * @desc    Get template usage statistics
 * @route   GET /api/v1/admin/templates/statistics
 * @access  Private (Admin only)
 */
const getTemplateStatistics = asyncHandler(async (req, res) => {
  // Templates by profession
  const byProfession = await Template.aggregate([
    {
      $group: {
        _id: '$profession',
        count: { $sum: 1 },
        active: {
          $sum: { $cond: ['$isActive', 1, 0] }
        }
      }
    }
  ]);

  // Templates by tier
  const byTier = await Template.aggregate([
    {
      $group: {
        _id: '$subscriptionTier',
        count: { $sum: 1 }
      }
    }
  ]);

  // Most used templates
  const mostUsed = await Template.find()
    .sort({ usageCount: -1 })
    .limit(10)
    .select('displayName usageCount rating');

  // Top rated templates
  const topRated = await Template.find({ 'rating.count': { $gte: 5 } })
    .sort({ 'rating.average': -1 })
    .limit(10)
    .select('displayName rating usageCount');

  const statistics = {
    byProfession,
    byTier,
    mostUsed,
    topRated,
    totalTemplates: await Template.countDocuments(),
    activeTemplates: await Template.countDocuments({ isActive: true })
  };

  return successResponse(res, statistics);
});

module.exports = {
  getAllTemplatesAdmin,
  createTemplate,
  updateTemplate,
  toggleTemplateStatus,
  deleteTemplate,
  duplicateTemplate,
  getTemplateAnalytics,
  bulkUpdateTemplates,
  getTemplateStatistics
};