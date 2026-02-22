// backend/src/controllers/template.controller.js
const Template = require('../models/Template.model');
const TemplateRating = require('../models/TemplateRating.model');
const Resume = require('../models/Resume.model');
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
    categoryId,
    profession,
    styleCategory,
    subscriptionTier,
    page = 1,
    limit = 20
  } = req.query;

  // If user is authenticated, check their subscription
  let userTier = 'free';
  if (req.user) {
    const subscription = await UserSubscription.findOne({ userId: req.user._id });
    if (subscription && subscription.isActive()) {
      userTier = subscription.planName.toLowerCase();
    } else {
      userTier = req.user.currentPlan?.toLowerCase() || 'free';
    }
  }

  // Build resilient query
  const tierHierarchy = {
    free: ['free'],
    basic: ['free', 'basic'],
    premium: ['free', 'basic', 'premium']
  };

  const accessHierarchy = {
    free: ['FREE', 'BOTH'],
    basic: ['FREE', 'BOTH'],
    premium: ['FREE', 'PREMIUM', 'BOTH']
  };

  const statusFilter = {
    $or: [
      { status: 'Active' },
      { isActive: true }
    ]
  };

  const query = {
    ...statusFilter
  };

  // Support categoryId filter
  if (categoryId) {
    query.categoryId = categoryId;
  }

  // Legacy support
  if (profession) query.profession = profession;
  if (styleCategory) query.styleCategory = styleCategory;

  const skip = (page - 1) * limit;

  const templates = await Template.find(query)
    .populate('categoryId', 'name status')
    .populate('themeId')
    .populate('adminLayoutId')
    .select('-htmlTemplate -cssTemplate -templateHtml') // Don't send full template in list
    .sort({ usageCount: -1, createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Template.countDocuments(query);

  // Get rating data for each template if user is authenticated
  let templatesWithRatings = templates.map(t => t.toObject());

  if (req.user) {
    const templateIds = templates.map(t => t._id);

    // Get user's ratings for these templates
    const userRatings = await TemplateRating.find({
      userId: req.user._id,
      templateId: { $in: templateIds }
    }).lean();

    // Get user's resume usage for these templates
    const userResumes = await Resume.find({
      userId: req.user._id,
      templateId: { $in: templateIds }
    }).distinct('templateId');

    // Create a map for quick lookup
    const ratingMap = {};
    userRatings.forEach(rating => {
      ratingMap[rating.templateId.toString()] = rating;
    });

    const usedTemplatesSet = new Set(userResumes.map(id => id.toString()));

    // Add rating data to each template
    templatesWithRatings = templatesWithRatings.map(template => {
      const templateIdStr = template._id.toString();
      const userRating = ratingMap[templateIdStr];
      const hasUsedTemplate = usedTemplatesSet.has(templateIdStr);

      return {
        ...template,
        averageRating: template.averageRating || 0,
        totalRatings: template.totalRatings || 0,
        ratingEnabled: template.ratingEnabled !== false, // Default to true
        userHasRated: !!userRating,
        userRating: userRating ? {
          rating: userRating.rating,
          review: userRating.review,
          status: userRating.status
        } : null,
        userCanRate: hasUsedTemplate && !userRating && template.ratingEnabled !== false
      };
    });
  } else {
    // For non-authenticated users, just add rating display data
    templatesWithRatings = templatesWithRatings.map(template => ({
      ...template,
      averageRating: template.averageRating || 0,
      totalRatings: template.totalRatings || 0,
      ratingEnabled: template.ratingEnabled !== false,
      userHasRated: false,
      userRating: null,
      userCanRate: false
    }));
  }

  return successResponse(res, {
    templates: templatesWithRatings,
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

  const templates = await Template.find({ profession, ...statusFilter, ...tierFilter })
    .populate('themeId')
    .populate('adminLayoutId')
    .sort({ usageCount: -1 });

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
  const template = await Template.findById(req.params.id)
    .populate('categoryId', 'name status')
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

  const isActiveTemplate = template && (template.status === 'Active' || template.isActive === true);
  if (!isActiveTemplate) {
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
      userTier = req.user.currentPlan?.toLowerCase() || 'free';
    }

    // Check tier access (resilient to both subscriptionTier and accessType)
    const tierHierarchy = {
      free: ['free'],
      basic: ['free', 'basic'],
      premium: ['free', 'basic', 'premium']
    };

    const accessHierarchy = {
      free: ['FREE', 'BOTH'],
      basic: ['FREE', 'BOTH'],
      premium: ['FREE', 'PREMIUM', 'BOTH']
    };

    const hasTierAccess = tierHierarchy[userTier].includes(template.subscriptionTier);
    const hasAccessTypeMatch = accessHierarchy[userTier].includes(template.accessType);

    canAccess = hasTierAccess || hasAccessTypeMatch;
    fullTemplate = canAccess;
  }

  const responseData = template.toObject();

  // Don't send full template if user can't access
  if (!fullTemplate) {
    delete responseData.htmlTemplate;
    delete responseData.cssTemplate;
    delete responseData.templateHtml;
    responseData.requiresUpgrade = !canAccess;
  }

  // Add rating data
  let ratingData = {
    averageRating: template.averageRating || 0,
    totalRatings: template.totalRatings || 0,
    ratingEnabled: template.ratingEnabled !== false,
    userHasRated: false,
    userRating: null,
    userCanRate: false
  };

  if (req.user) {
    // Get user's rating for this template
    const userRating = await TemplateRating.findOne({
      userId: req.user._id,
      templateId: template._id
    }).lean();

    // Check if user has used this template
    const hasUsedTemplate = await Resume.exists({
      userId: req.user._id,
      templateId: template._id
    });

    ratingData.userHasRated = !!userRating;
    ratingData.userRating = userRating ? {
      rating: userRating.rating,
      review: userRating.review,
      status: userRating.status
    } : null;
    ratingData.userCanRate = hasUsedTemplate && !userRating && template.ratingEnabled !== false;
  }

  return successResponse(res, {
    template: {
      ...responseData,
      ...ratingData
    },
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
  const template = await Template.findById(req.params.id)
    .populate('categoryId', 'name status');

  const isActiveTemplate = template && (template.status === 'Active' || template.isActive === true);
  if (!isActiveTemplate) {
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
  const template = await Template.findById(req.params.id)
    .populate('categoryId', 'name status');

  const isActiveTemplate = template && (template.status === 'Active' || template.isActive === true);
  if (!isActiveTemplate) {
    return notFoundResponse(res, 'Template not found');
  }

  // Check subscription access
  const subscription = await UserSubscription.findOne({ userId: req.user._id });
  let userTier = 'free';

  if (subscription && subscription.isActive()) {
    userTier = subscription.planName.toLowerCase();
  } else {
    userTier = req.user.currentPlan?.toLowerCase() || 'free';
  }

  // Verify tier access (resilient to both subscriptionTier and accessType)
  const tierHierarchy = {
    free: ['free'],
    basic: ['free', 'basic'],
    premium: ['free', 'basic', 'premium']
  };

  const accessHierarchy = {
    free: ['FREE', 'BOTH'],
    basic: ['FREE', 'BOTH'],
    premium: ['FREE', 'PREMIUM', 'BOTH']
  };

  const hasTierAccess = tierHierarchy[userTier].includes(template.subscriptionTier);
  const hasAccessTypeMatch = accessHierarchy[userTier].includes(template.accessType);

  if (!hasTierAccess && !hasAccessTypeMatch) {
    return forbiddenResponse(
      res,
      `This template requires ${template.subscriptionTier || template.accessType} subscription`
    );
  }

  // Increment usage
  await template.incrementUsage();

  return successResponse(res, {
    template: {
      ...template.toObject(),
      templateHtml: template.templateHtml || template.htmlTemplate, // Backward compatibility
    }
  }, 'Template loaded successfully');
});

/**
 * @desc    Create template (Admin only)
 * @route   POST /api/v1/templates
 * @access  Private (Admin)
 */
const createTemplate = asyncHandler(async (req, res) => {
  // Ensure isPremium is properly set based on payload
  // If isPremium is provided, use it; otherwise default to false
  const templateData = {
    ...req.body,
    isPremium: req.body.isPremium === true || req.body.isPremium === 'true' || req.body.isPremium === 1
  };

  // Sync subscriptionTier with isPremium for backward compatibility
  if (templateData.isPremium) {
    templateData.subscriptionTier = 'premium';
  } else if (!templateData.subscriptionTier) {
    templateData.subscriptionTier = 'free';
  }

  const template = await Template.create(templateData);

  return createdResponse(res, { template }, 'Template created successfully');
});

/**
 * @desc    Update template (Admin only)
 * @route   PUT /api/v1/templates/:id
 * @access  Private (Admin)
 */
const updateTemplate = asyncHandler(async (req, res) => {
  // Ensure isPremium is properly set based on payload
  // If isPremium is provided, use it; otherwise keep existing value
  const updateData = { ...req.body };

  if ('isPremium' in req.body) {
    updateData.isPremium = req.body.isPremium === true || req.body.isPremium === 'true' || req.body.isPremium === 1;

    // Sync subscriptionTier with isPremium for backward compatibility
    if (updateData.isPremium) {
      updateData.subscriptionTier = 'premium';
    } else {
      updateData.subscriptionTier = 'free';
    }
  }

  const template = await Template.findByIdAndUpdate(
    req.params.id,
    updateData,
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
  // Use layoutHtml from config if available (new builder), otherwise fallback to templateHtml/htmlTemplate
  let html = '';
  if (template.config && template.config.layoutHtml) {
    html = template.config.layoutHtml;
  } else {
    html = template.templateHtml || template.htmlTemplate || '';
  }

  // Define a comprehensive sample data for preview if missing
  const defaultPreviewData = {
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 000-0000',
    location: 'New York, NY',
    profileSummary: 'Experienced professional with a proven track record of success in project management and team leadership. Skilled in strategic planning, process optimization, and delivering high-quality results in fast-paced environments.',
    skills: ['Project Management', 'Team Leadership', 'Strategic Planning', 'Process Optimization', 'Communication'],
    experience: '<strong>Senior Manager</strong> at ABC Corp (2018 - Present)<br>Led a team of 10+ people and increased revenue by 20%.',
    education: '<strong>MBA</strong> from University Specializing in Business (2016)',
    sections: {
      left: '<div class="section"><h3>Skills</h3><ul><li>Project Management</li><li>Team Leadership</li></ul></div>',
      right: '<div class="section"><h3>Experience</h3><p>Senior Manager at ABC Corp...</p></div>'
    }
  };

  const previewData = template.previewData || defaultPreviewData;

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

  const css = template.cssTemplate || '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>${css}</style>
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