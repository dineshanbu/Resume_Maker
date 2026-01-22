// backend/src/controllers/templateRating.controller.js
const TemplateRating = require('../models/TemplateRating.model');
const Template = require('../models/Template.model');
const Resume = require('../models/Resume.model');
const asyncHandler = require('../utils/asyncHandler');
const {
  successResponse,
  createdResponse,
  badRequestResponse,
  notFoundResponse,
  forbiddenResponse
} = require('../utils/apiResponse');

/**
 * @desc    Submit or update rating for a template
 * @route   POST /api/v1/template-ratings
 * @access  Private
 */
const submitRating = asyncHandler(async (req, res) => {
  const { templateId, rating, review } = req.body;
  const userId = req.user._id;

  // Validation
  if (!templateId) {
    return badRequestResponse(res, 'Template ID is required');
  }

  if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    return badRequestResponse(res, 'Rating must be an integer between 1 and 5');
  }

  if (review && review.length > 300) {
    return badRequestResponse(res, 'Review cannot exceed 300 characters');
  }

  // Check if template exists and rating is enabled
  const template = await Template.findById(templateId);
  if (!template) {
    return notFoundResponse(res, 'Template not found');
  }

  if (!template.ratingEnabled) {
    return forbiddenResponse(res, 'Rating is disabled for this template');
  }

  // Check if user has used this template (has at least one resume with this template)
  const userResume = await Resume.findOne({
    userId: userId,
    templateId: templateId
  });

  if (!userResume) {
    return forbiddenResponse(
      res,
      'You must create a resume using this template before you can rate it'
    );
  }

  // Find existing rating or create new one
  let templateRating = await TemplateRating.findOne({
    userId: userId,
    templateId: templateId
  });

  const isUpdate = !!templateRating;

  if (templateRating) {
    // Update existing rating
    templateRating.rating = rating;
    templateRating.review = review || '';
    templateRating.status = 'pending'; // Reset to pending on update for moderation
    templateRating.updatedAt = Date.now();
    await templateRating.save();
  } else {
    // Create new rating
    templateRating = await TemplateRating.create({
      userId: userId,
      templateId: templateId,
      rating: rating,
      review: review || '',
      status: 'pending'
    });
  }

  // Update template stats only if status is approved
  // For new/updated ratings, stats will be updated after admin approval
  if (templateRating.status === 'approved') {
    await templateRating.updateTemplateStats();
  }

  return successResponse(
    res,
    {
      rating: templateRating,
      message: isUpdate
        ? 'Rating updated successfully. It will be reviewed by admin.'
        : 'Rating submitted successfully. It will be reviewed by admin.'
    },
    isUpdate ? 'Rating updated successfully' : 'Rating submitted successfully'
  );
});

/**
 * @desc    Get user's rating for a template
 * @route   GET /api/v1/template-ratings/template/:templateId
 * @access  Private
 */
const getUserRating = asyncHandler(async (req, res) => {
  const { templateId } = req.params;
  const userId = req.user._id;

  const rating = await TemplateRating.findOne({
    userId: userId,
    templateId: templateId
  });

  return successResponse(res, {
    rating: rating || null,
    hasRated: !!rating
  });
});

/**
 * @desc    Get all ratings for a template (approved only for public)
 * @route   GET /api/v1/template-ratings/template/:templateId/all
 * @access  Public (approved only) / Private (all for admin)
 */
const getTemplateRatings = asyncHandler(async (req, res) => {
  const { templateId } = req.params;
  const { status, page = 1, limit = 10 } = req.query;
  const isAdmin = req.user && req.user.role === 'admin';

  // Build query
  const query = { templateId: templateId };

  // Non-admin users can only see approved ratings
  if (!isAdmin) {
    query.status = 'approved';
  } else if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;

  const ratings = await TemplateRating.find(query)
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await TemplateRating.countDocuments(query);

  return successResponse(res, {
    ratings,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit)
    }
  });
});

/**
 * @desc    Get all template ratings (Admin only)
 * @route   GET /api/v1/admin/template-ratings
 * @access  Private (Admin)
 */
const getAllRatings = asyncHandler(async (req, res) => {
  const { status, templateId, page = 1, limit = 20 } = req.query;

  const query = {};
  if (status) query.status = status;
  if (templateId) query.templateId = templateId;

  const skip = (page - 1) * limit;

  const ratings = await TemplateRating.find(query)
    .populate('userId', 'name email')
    .populate('templateId', 'name displayName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await TemplateRating.countDocuments(query);

  return successResponse(res, {
    ratings,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit)
    }
  });
});

/**
 * @desc    Approve or reject a rating (Admin only)
 * @route   PATCH /api/v1/admin/template-ratings/:id
 * @access  Private (Admin)
 */
const moderateRating = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['approved', 'rejected'].includes(status)) {
    return badRequestResponse(res, 'Status must be either "approved" or "rejected"');
  }

  const rating = await TemplateRating.findById(id);
  if (!rating) {
    return notFoundResponse(res, 'Rating not found');
  }

  const oldStatus = rating.status;
  rating.status = status;
  await rating.save();

  // Update template stats if status changed to/from approved
  if (oldStatus !== status) {
    if (status === 'approved' || oldStatus === 'approved') {
      await rating.updateTemplateStats();
    }
  }

  return successResponse(
    res,
    { rating },
    `Rating ${status} successfully`
  );
});

/**
 * @desc    Toggle rating enabled/disabled for a template (Admin only)
 * @route   PATCH /api/v1/admin/templates/:id/rating-toggle
 * @access  Private (Admin)
 */
const toggleTemplateRating = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { ratingEnabled } = req.body;

  if (typeof ratingEnabled !== 'boolean') {
    return badRequestResponse(res, 'ratingEnabled must be a boolean');
  }

  const template = await Template.findByIdAndUpdate(
    id,
    { ratingEnabled: ratingEnabled },
    { new: true, runValidators: true }
  );

  if (!template) {
    return notFoundResponse(res, 'Template not found');
  }

  return successResponse(
    res,
    { template },
    `Rating ${ratingEnabled ? 'enabled' : 'disabled'} for template`
  );
});

module.exports = {
  submitRating,
  getUserRating,
  getTemplateRatings,
  getAllRatings,
  moderateRating,
  toggleTemplateRating
};
