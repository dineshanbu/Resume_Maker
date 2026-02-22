// backend/src/controllers/admin/adminTemplate.controller.js
const Template = require('../../models/Template.model');
const TemplateCategory = require('../../models/TemplateCategory.model');
const asyncHandler = require('../../utils/asyncHandler');
const {
  successResponse,
  createdResponse,
  notFoundResponse,
  badRequestResponse,
  validationErrorResponse
} = require('../../utils/apiResponse');
const { uploadImage, deleteFromCloudinary, extractPublicId } = require('../../services/cloudinary.service');
const multer = require('multer');

// Configure multer for memory storage (template images)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB max for template images
  },
  fileFilter: (req, file, cb) => {
    // Allow only JPG and PNG images
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only JPG and PNG images are allowed'), false);
    }
  }
});

// Multer middleware for single image upload (export for use in routes)
const uploadTemplateImage = upload.single('thumbnailImage');

/**
 * @desc    Get all templates (Admin view)
 * @route   GET /api/v1/admin/templates
 * @access  Private (Admin only)
 */
const getAllTemplatesAdmin = asyncHandler(async (req, res) => {
  const {
    status,
    categoryId,
    profession,
    tier,
    page = 1,
    limit = 20,
    search
  } = req.query;

  // Build query
  const query = {};

  // Use status field (Active/Inactive) - support both old and new
  if (status === 'Active' || status === 'Inactive') {
    query.status = status;
  } else if (status === 'active') {
    query.status = 'Active';
  } else if (status === 'inactive') {
    query.status = 'Inactive';
  }

  // Support categoryId filter
  if (categoryId) {
    query.categoryId = categoryId;
  }

  // Legacy support
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
    .populate('categoryId', 'name status')
    .populate('createdBy', 'fullName email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Template.countDocuments(query);

  // Get statistics
  const stats = {
    total: await Template.countDocuments(),
    active: await Template.countDocuments({ status: 'Active' }),
    inactive: await Template.countDocuments({ status: 'Inactive' }),
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
  // Validate image is required for creation (either as file or existing URL)
  if (!req.file && !req.body.thumbnailImage && !req.body.previewImage) {
    return validationErrorResponse(res, ['Template preview image is required']);
  }

  // Validate file type
  if (!req.file.mimetype.startsWith('image/')) {
    return badRequestResponse(res, 'Only JPG and PNG image files are allowed');
  }

  // Validate file size (2MB)
  if (req.file.size > 2 * 1024 * 1024) {
    return badRequestResponse(res, 'Image size must be less than 2MB');
  }

  const templateData = req.body;

  // Validate required fields
  const errors = [];
  if (!templateData.name) errors.push('Template name is required');
  if (!templateData.categoryId && !templateData.category) errors.push('Category is required');
  if (!templateData.templateHtml) errors.push('Template HTML is required');

  if (errors.length > 0) {
    return validationErrorResponse(res, errors);
  }

  // Handle category - support both categoryId (ObjectId) and category (name)
  let categoryId = templateData.categoryId;
  const mongoose = require('mongoose');

  if (!categoryId && templateData.category) {
    // If category name is provided, find the category by name (case-insensitive)
    const category = await TemplateCategory.findOne({
      name: { $regex: new RegExp(`^${templateData.category.trim()}$`, 'i') },
      status: 'Active'
    });

    if (!category) {
      // Try to find any category with similar name (even inactive) for better error message
      const similarCategory = await TemplateCategory.findOne({
        name: { $regex: new RegExp(`^${templateData.category.trim()}$`, 'i') }
      });

      if (similarCategory) {
        return badRequestResponse(res, `Category "${templateData.category}" exists but is Inactive. Please activate it in Master Data first.`);
      }

      // List available categories for better error message
      const availableCategories = await TemplateCategory.find({ status: 'Active' }).select('name').limit(10);
      const categoryNames = availableCategories.map(c => c.name).join(', ');

      return badRequestResponse(res, `Category "${templateData.category}" not found. Available categories: ${categoryNames || 'None'}. Please create it in Master Data (Template Categories) first.`);
    }
    categoryId = category._id;
  }

  // Validate categoryId exists and is valid ObjectId
  if (!categoryId) {
    return badRequestResponse(res, 'Category is required');
  }

  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    return badRequestResponse(res, 'Invalid category ID format');
  }

  const category = await TemplateCategory.findById(categoryId);
  if (!category) {
    return badRequestResponse(res, 'Category not found');
  }

  // Check if template with same name exists
  const existingTemplate = await Template.findOne({ name: templateData.name });
  if (existingTemplate) {
    return res.status(409).json({
      success: false,
      message: 'Template with this name already exists'
    });
  }

  try {
    let thumbnailUrl = req.body.thumbnailImage || req.body.previewImage;

    // If file uploaded, use it (priority)
    if (req.file) {
      // Upload image to Cloudinary
      const uploadResult = await uploadImage(req.file.buffer, {
        folder: 'templates/thumbnails',
        mimeType: req.file.mimetype,
        transformation: [
          { width: 800, height: 1000, crop: 'fill', gravity: 'auto' },
          { quality: 'auto', fetch_format: 'auto' }
        ]
      });
      thumbnailUrl = uploadResult.url;
    }

    // Prepare template data
    const newTemplateData = {
      name: templateData.name,
      displayName: templateData.displayName || templateData.name, // Use name as default
      description: templateData.description || `Resume template: ${templateData.name}`, // Default description
      categoryId: categoryId,
      templateHtml: templateData.templateHtml,
      thumbnailImage: thumbnailUrl,
      status: templateData.status || 'Active',
      createdBy: req.user._id
    };

    // Optional fields
    if (templateData.htmlTemplate) newTemplateData.htmlTemplate = templateData.htmlTemplate;
    if (templateData.cssTemplate) newTemplateData.cssTemplate = templateData.cssTemplate;

    // Unify tier and premium fields
    const subscriptionTier = (templateData.subscriptionTier || 'free').toLowerCase();
    const isPremium = templateData.isPremium === true || templateData.isPremium === 'true' || subscriptionTier === 'premium';

    newTemplateData.subscriptionTier = subscriptionTier;
    newTemplateData.isPremium = isPremium;

    // Sync accessType for backward compatibility
    if (isPremium) {
      newTemplateData.accessType = 'PREMIUM';
    } else {
      newTemplateData.accessType = 'FREE';
    }

    if (templateData.thumbnail) newTemplateData.thumbnail = templateData.thumbnail;

    // New builder fields - parse config if it's a string (from multipart/form-data)
    if (templateData.config) {
      try {
        newTemplateData.config = typeof templateData.config === 'string'
          ? JSON.parse(templateData.config)
          : templateData.config;
        console.log('✅ Parsed config for create:', newTemplateData.config);
      } catch (e) {
        console.error('❌ Failed to parse config:', e);
        newTemplateData.config = templateData.config; // Use as-is if parsing fails
      }
    }
    if (templateData.adminLayoutId) newTemplateData.adminLayoutId = templateData.adminLayoutId;
    if (templateData.themeId) newTemplateData.themeId = templateData.themeId;
    if (templateData.sectionLayouts) newTemplateData.sectionLayouts = templateData.sectionLayouts;

    // Create template
    const template = await Template.create(newTemplateData);
    await template.populate('categoryId', 'name status');
    await template.populate('createdBy', 'fullName email');

    // ============================================
    // TRIGGER: Send notifications and emails
    // ============================================
    // Run asynchronously to not block admin response
    setImmediate(async () => {
      try {
        console.log('📢 Triggering notifications and emails for new template...');

        // STEP 1: Fetch all active users (role = "user", isActive = true)
        const User = require('../../models/User.model');
        const activeUsers = await User.find({
          role: 'user',
          isActive: true
        }).select('_id email fullName');

        console.log(`✓ Found ${activeUsers.length} active users`);

        if (activeUsers.length === 0) {
          console.log('⚠ No active users found, skipping notifications');
          return;
        }

        const userIds = activeUsers.map(u => u._id);

        // STEP 2: Create in-app notifications for all users
        try {
          const { createNewTemplateNotification } = require('../../services/notification.service');
          await createNewTemplateNotification(userIds, template);
          console.log(`✓ Created in-app notifications for ${userIds.length} users`);
        } catch (notifError) {
          console.error('✗ Error creating notifications:', notifError.message);
          // Continue even if notifications fail
        }

        // STEP 3: Send emails to all users (using email template from DB)
        try {
          const { sendNewTemplateEmailsToUsers } = require('../../services/email.service');
          await sendNewTemplateEmailsToUsers(activeUsers, template);
          console.log(`✓ Triggered email sending for ${activeUsers.length} users`);
        } catch (emailError) {
          console.error('✗ Error triggering emails:', emailError.message);
          // Continue even if emails fail
        }

        console.log('✓ Template notification process completed');
      } catch (error) {
        console.error('✗ Error in template notification trigger:', error);
        // Don't throw - allow template creation to succeed even if notifications fail
      }
    });

    return createdResponse(res, { template }, 'Template created successfully');
  } catch (error) {
    console.error('Template creation error:', error);
    return badRequestResponse(res, `Failed to create template: ${error.message}`);
  }
});

/**
 * @desc    Get single template by ID
 * @route   GET /api/v1/admin/templates/:id
 * @access  Private (Admin only)
 */
const getTemplateById = asyncHandler(async (req, res) => {
  const template = await Template.findById(req.params.id)
    .populate('categoryId', 'name status')
    .populate('createdBy', 'fullName email')
    .populate('themeId')
    .populate('adminLayoutId')
    .populate([
      { path: 'sectionLayouts.header' },
      { path: 'sectionLayouts.summary' },
      { path: 'sectionLayouts.experience' },
      { path: 'sectionLayouts.education' },
      { path: 'sectionLayouts.skills' },
      { path: 'sectionLayouts.projects' },
      { path: 'sectionLayouts.certifications' },
      { path: 'sectionLayouts.languages' },
      { path: 'sectionLayouts.achievements' },
      { path: 'sectionLayouts.interests' },
      { path: 'sectionLayouts.references' }
    ]);

  if (!template) {
    return notFoundResponse(res, 'Template not found');
  }

  return successResponse(res, { template }, 'Template retrieved successfully');
});

/**
 * @desc    Update template
 * @route   PUT /api/v1/admin/templates/:id
 * @access  Private (Admin only)
 */
const updateTemplate = asyncHandler(async (req, res) => {
  const template = await Template.findById(req.params.id);

  if (!template) {
    return notFoundResponse(res, 'Template not found');
  }

  // Handle category - support both categoryId (ObjectId) and category (name)
  if (req.body.categoryId || req.body.category) {
    let categoryId = req.body.categoryId;
    const mongoose = require('mongoose');

    // If category name is provided instead of categoryId, find it
    if (!categoryId && req.body.category) {
      const category = await TemplateCategory.findOne({
        name: { $regex: new RegExp(`^${req.body.category.trim()}$`, 'i') },
        status: 'Active'
      });

      if (!category) {
        // Try to find any category with similar name (even inactive) for better error message
        const similarCategory = await TemplateCategory.findOne({
          name: { $regex: new RegExp(`^${req.body.category.trim()}$`, 'i') }
        });

        if (similarCategory) {
          return badRequestResponse(res, `Category "${req.body.category}" exists but is Inactive. Please activate it in Master Data first.`);
        }

        // List available categories for better error message
        const availableCategories = await TemplateCategory.find({ status: 'Active' }).select('name').limit(10);
        const categoryNames = availableCategories.map(c => c.name).join(', ');

        return badRequestResponse(res, `Category "${req.body.category}" not found. Available categories: ${categoryNames || 'None'}. Please create it in Master Data (Template Categories) first.`);
      }
      categoryId = category._id;
      req.body.categoryId = categoryId;
    }

    // Validate categoryId exists (if ObjectId format)
    if (categoryId) {
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return badRequestResponse(res, 'Invalid category ID format');
      }

      const category = await TemplateCategory.findById(categoryId);
      if (!category) {
        return badRequestResponse(res, 'Category not found');
      }
    }
  }

  // If new image uploaded, replace old one
  if (req.file) {
    // Validate file type
    if (!req.file.mimetype.startsWith('image/')) {
      return badRequestResponse(res, 'Only JPG and PNG image files are allowed');
    }

    // Validate file size (2MB)
    if (req.file.size > 2 * 1024 * 1024) {
      return badRequestResponse(res, 'Image size must be less than 2MB');
    }

    try {
      // Delete old image from Cloudinary if exists
      if (template.thumbnailImage) {
        const oldPublicId = extractPublicId(template.thumbnailImage);
        if (oldPublicId) {
          try {
            await deleteFromCloudinary(oldPublicId, 'image');
          } catch (error) {
            console.warn('Failed to delete old template image:', error.message);
          }
        }
      }

      // Upload new image to Cloudinary
      const uploadResult = await uploadImage(req.file.buffer, {
        folder: 'templates/thumbnails',
        mimeType: req.file.mimetype,
        transformation: [
          { width: 800, height: 1000, crop: 'fill', gravity: 'auto' },
          { quality: 'auto', fetch_format: 'auto' }
        ]
      });

      req.body.thumbnailImage = uploadResult.url;
    } catch (error) {
      console.error('Image upload error:', error);
      return badRequestResponse(res, `Failed to upload image: ${error.message}`);
    }
  }

  // Handle plan updates and field synchronization
  if ('subscriptionTier' in req.body || 'isPremium' in req.body) {
    const subscriptionTier = (req.body.subscriptionTier || template.subscriptionTier || 'free').toLowerCase();
    const isPremium = req.body.isPremium === true || req.body.isPremium === 'true' || subscriptionTier === 'premium';

    req.body.subscriptionTier = subscriptionTier;
    req.body.isPremium = isPremium;

    // Sync accessType
    req.body.accessType = isPremium ? 'PREMIUM' : 'FREE';
  }

  // Parse config and other JSON fields if they're strings (from multipart/form-data)
  if (req.body.config && typeof req.body.config === 'string') {
    try {
      req.body.config = JSON.parse(req.body.config);
      console.log('✅ Parsed config for update:', req.body.config);
    } catch (e) {
      console.error('❌ Failed to parse config:', e);
    }
  }

  if (req.body.sectionLayouts && typeof req.body.sectionLayouts === 'string') {
    try {
      req.body.sectionLayouts = JSON.parse(req.body.sectionLayouts);
    } catch (e) {
      console.error('❌ Failed to parse sectionLayouts:', e);
    }
  }

  // Update template
  const updatedTemplate = await Template.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  )
    .populate('categoryId', 'name status')
    .populate('createdBy', 'fullName email');

  return successResponse(res, { template: updatedTemplate }, 'Template updated successfully');
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

  // Toggle status field
  template.status = template.status === 'Active' ? 'Inactive' : 'Active';
  // Also update isActive for backward compatibility
  template.isActive = template.status === 'Active';
  await template.save();
  await template.populate('categoryId', 'name status');

  return successResponse(
    res,
    { template },
    `Template ${template.status === 'Active' ? 'activated' : 'deactivated'} successfully`
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
  templateData.status = 'Inactive';
  templateData.isActive = false;
  templateData.createdBy = req.user._id;

  const duplicatedTemplate = await Template.create(templateData);
  await duplicatedTemplate.populate('categoryId', 'name status');
  await duplicatedTemplate.populate('createdBy', 'fullName email');

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
  getTemplateById,
  createTemplate,
  updateTemplate,
  toggleTemplateStatus,
  deleteTemplate,
  duplicateTemplate,
  getTemplateAnalytics,
  bulkUpdateTemplates,
  getTemplateStatistics,
  uploadTemplateImage // Export multer middleware for routes
};