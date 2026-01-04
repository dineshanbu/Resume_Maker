// backend/src/controllers/template.controller.js
const Template = require('../models/Template.model');
const { UserSubscription } = require('../models/Subscription.model');
const asyncHandler = require('../utils/asyncHandler');
const {
  successResponse,
  createdResponse,
  notFoundResponse,
  forbiddenResponse
} = require('../utils/apiResponse');

/**
 * @desc    Get all templates
 * @route   GET /api/v1/templates
 * @access  Public
 */
const getAllTemplates = asyncHandler(async (req, res) => {
  const {
    profession,
    styleCategory,
    subscriptionTier,
    page = 1,
    limit = 20
  } = req.query;

  // Build query
  const query = { isActive: true };

  if (profession) query.profession = profession;
  if (styleCategory) query.styleCategory = styleCategory;

  // If user is authenticated, check their subscription
  let userTier = 'free';
  if (req.user) {
    const subscription = await UserSubscription.findOne({ userId: req.user._id });
    if (subscription && subscription.isActive()) {
      userTier = subscription.planName.toLowerCase();
    } else {
      userTier = req.user.currentPlan.toLowerCase();
    }
  }

  // Filter by accessible tiers
  const tierHierarchy = {
    free: ['free'],
    basic: ['free', 'basic'],
    premium: ['free', 'basic', 'premium']
  };

  if (subscriptionTier) {
    query.subscriptionTier = subscriptionTier;
  } else {
    query.subscriptionTier = { $in: tierHierarchy[userTier] };
  }

  const skip = (page - 1) * limit;

  const templates = await Template.find(query)
    .select('-htmlTemplate -cssTemplate') // Don't send full template in list
    .sort({ usageCount: -1, createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Template.countDocuments(query);

  return successResponse(res, {
    templates,
    userTier,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit)
    }
  });
});

/**
 * @desc    Get templates by profession
 * @route   GET /api/v1/templates/profession/:profession
 * @access  Public
 */
const getTemplatesByProfession = asyncHandler(async (req, res) => {
  const { profession } = req.params;

  // Get user tier
  let userTier = 'free';
  if (req.user) {
    const subscription = await UserSubscription.findOne({ userId: req.user._id });
    if (subscription && subscription.isActive()) {
      userTier = subscription.planName.toLowerCase();
    } else {
      userTier = req.user.currentPlan.toLowerCase();
    }
  }

  const templates = await Template.getByProfession(profession, userTier);

  return successResponse(res, {
    templates: templates.map(t => ({
      ...t.toObject(),
      htmlTemplate: undefined,
      cssTemplate: undefined
    })),
    profession,
    userTier
  });
});

/**
 * @desc    Get single template by ID
 * @route   GET /api/v1/templates/:id
 * @access  Public (but full template only for authenticated users)
 */
const getTemplateById = asyncHandler(async (req, res) => {
  const template = await Template.findById(req.params.id);

  if (!template || !template.isActive) {
    return notFoundResponse(res, 'Template not found');
  }

  // Check if user can access this template
  let canAccess = true;
  let fullTemplate = false;

  if (req.user) {
    const subscription = await UserSubscription.findOne({ userId: req.user._id });
    let userTier = 'free';

    if (subscription && subscription.isActive()) {
      userTier = subscription.planName.toLowerCase();
    } else {
      userTier = req.user.currentPlan.toLowerCase();
    }

    // Check tier access
    const tierHierarchy = {
      free: ['free'],
      basic: ['free', 'basic'],
      premium: ['free', 'basic', 'premium']
    };

    canAccess = tierHierarchy[userTier].includes(template.subscriptionTier);
    fullTemplate = canAccess;
  }

  const responseData = template.toObject();

  // Don't send full template if user can't access
  if (!fullTemplate) {
    delete responseData.htmlTemplate;
    delete responseData.cssTemplate;
    responseData.requiresUpgrade = !canAccess;
  }

  return successResponse(res, {
    template: responseData,
    canAccess,
    hasFullAccess: fullTemplate
  });
});

/**
 * @desc    Get template preview HTML
 * @route   GET /api/v1/templates/:id/preview
 * @access  Public
 */
const getTemplatePreview = asyncHandler(async (req, res) => {
  const template = await Template.findById(req.params.id);

  if (!template || !template.isActive) {
    return notFoundResponse(res, 'Template not found');
  }

  // Generate preview HTML with sample data
  const previewHTML = generatePreviewHTML(template);

  res.setHeader('Content-Type', 'text/html');
  res.send(previewHTML);
});

/**
 * @desc    Use template (requires authentication)
 * @route   POST /api/v1/templates/:id/use
 * @access  Private
 */
const useTemplate = asyncHandler(async (req, res) => {
  const template = await Template.findById(req.params.id);

  if (!template || !template.isActive) {
    return notFoundResponse(res, 'Template not found');
  }

  // Check subscription access
  const subscription = await UserSubscription.findOne({ userId: req.user._id });
  let userTier = 'free';

  if (subscription && subscription.isActive()) {
    userTier = subscription.planName.toLowerCase();
  } else {
    userTier = req.user.currentPlan.toLowerCase();
  }

  // Verify tier access
  const tierHierarchy = {
    free: ['free'],
    basic: ['free', 'basic'],
    premium: ['free', 'basic', 'premium']
  };

  if (!tierHierarchy[userTier].includes(template.subscriptionTier)) {
    return forbiddenResponse(
      res,
      `This template requires ${template.subscriptionTier} subscription`
    );
  }

  // Increment usage
  await template.incrementUsage();

  return successResponse(res, {
    template: {
      _id: template._id,
      name: template.name,
      htmlTemplate: template.htmlTemplate,
      cssTemplate: template.cssTemplate,
      availableSections: template.availableSections,
      customFields: template.customFields,
      colorScheme: template.colorScheme
    }
  }, 'Template loaded successfully');
});

/**
 * @desc    Create template (Admin only)
 * @route   POST /api/v1/templates
 * @access  Private (Admin)
 */
const createTemplate = asyncHandler(async (req, res) => {
  const template = await Template.create(req.body);

  return createdResponse(res, { template }, 'Template created successfully');
});

/**
 * @desc    Update template (Admin only)
 * @route   PUT /api/v1/templates/:id
 * @access  Private (Admin)
 */
const updateTemplate = asyncHandler(async (req, res) => {
  const template = await Template.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!template) {
    return notFoundResponse(res, 'Template not found');
  }

  return successResponse(res, { template }, 'Template updated successfully');
});

/**
 * @desc    Delete template (Admin only)
 * @route   DELETE /api/v1/templates/:id
 * @access  Private (Admin)
 */
const deleteTemplate = asyncHandler(async (req, res) => {
  const template = await Template.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );

  if (!template) {
    return notFoundResponse(res, 'Template not found');
  }

  return successResponse(res, null, 'Template deleted successfully');
});

/**
 * @desc    Rate template
 * @route   POST /api/v1/templates/:id/rate
 * @access  Private
 */
const rateTemplate = asyncHandler(async (req, res) => {
  const { rating } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return badRequestResponse(res, 'Rating must be between 1 and 5');
  }

  const template = await Template.findById(req.params.id);

  if (!template) {
    return notFoundResponse(res, 'Template not found');
  }

  await template.addRating(rating);

  return successResponse(res, {
    rating: template.rating
  }, 'Rating added successfully');
});

/**
 * Helper function to generate preview HTML
 */
const generatePreviewHTML = (template) => {
  const previewData = template.previewData || {
    personalInfo: {
      fullName: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890'
    },
    summary: 'Professional summary goes here...'
  };

  let html = template.htmlTemplate;

  // Replace placeholders with preview data
  Object.keys(previewData).forEach(key => {
    const value = previewData[key];
    if (typeof value === 'object') {
      Object.keys(value).forEach(subKey => {
        const placeholder = `{{${key}.${subKey}}}`;
        html = html.replace(new RegExp(placeholder, 'g'), value[subKey] || '');
      });
    } else {
      const placeholder = `{{${key}}}`;
      html = html.replace(new RegExp(placeholder, 'g'), value || '');
    }
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>${template.cssTemplate}</style>
    </head>
    <body>
      ${html}
    </body>
    </html>
  `;
};

module.exports = {
  getAllTemplates,
  getTemplatesByProfession,
  getTemplateById,
  getTemplatePreview,
  useTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  rateTemplate
};