// backend/src/controllers/user.controller.js
const mongoose = require('mongoose');
const User = require('../models/User.model');
const Resume = require('../models/Resume.model');
const Application = require('../models/Application.model');
const asyncHandler = require('../utils/asyncHandler');
const {
  successResponse,
  notFoundResponse,
  badRequestResponse
} = require('../utils/apiResponse');

/**
 * @desc    Get user profile
 * @route   GET /api/v1/users/:id
 * @access  Public
 */
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return notFoundResponse(res, 'User not found');
  }

  const userData = user.getPublicProfile();

  return successResponse(res, { user: userData });
});

/**
 * @desc    Get current user profile
 * @route   GET /api/v1/users/profile
 * @access  Private
 */
const getMyProfile = asyncHandler(async (req, res) => {
  // User is already attached to req by authenticate middleware
  // But we want to ensure we have the latest data including subscription fields
  const user = await User.findById(req.user._id).populate('subscriptionPlan');

  if (!user) {
    return notFoundResponse(res, 'User not found');
  }

  const userData = user.getPublicProfile();
  const plan = user.subscriptionPlan;

  // Robust resume limit detection
  let resumeLimit = 3; // Default
  if (plan) {
    resumeLimit = Math.max(plan.resumeLimit || 0, plan.maxFreeTemplates || 0) || (plan.name === 'PRO' ? -1 : 3);
  }

  // Fresh resume count for UI consistency
  const resumesCreated = await Resume.countDocuments({ userId: user._id });

  return successResponse(res, {
    user: userData,
    subscriptionStatus: user.subscriptionStatus,
    resumeLimit,
    resumesCreated,
    subscriptionPlan: user.subscriptionPlan
  });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/v1/users/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const {
    fullName,
    phone,
    location,
    profilePicture,
    preferences
  } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    return notFoundResponse(res, 'User not found');
  }

  // Update fields if provided
  if (fullName) user.fullName = fullName;
  if (phone) user.phone = phone;
  if (location) user.location = { ...user.location, ...location };
  if (profilePicture) user.profilePicture = profilePicture;
  if (preferences) user.preferences = { ...user.preferences, ...preferences };

  await user.save();

  return successResponse(res, { user: user.getPublicProfile() }, 'Profile updated successfully');
});

/**
 * @desc    Update user preferences
 * @route   PUT /api/v1/users/preferences
 * @access  Private
 */
const updatePreferences = asyncHandler(async (req, res) => {
  const { jobCategories, jobTypes, expectedSalary, receiveEmailAlerts } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    return notFoundResponse(res, 'User not found');
  }

  // Update preferences
  if (jobCategories) user.preferences.jobCategories = jobCategories;
  if (jobTypes) user.preferences.jobTypes = jobTypes;
  if (expectedSalary) user.preferences.expectedSalary = expectedSalary;
  if (receiveEmailAlerts !== undefined) {
    user.preferences.receiveEmailAlerts = receiveEmailAlerts;
  }

  await user.save();

  return successResponse(
    res,
    { preferences: user.preferences },
    'Preferences updated successfully'
  );
});

/**
 * @desc    Get user dashboard stats
 * @route   GET /api/v1/users/dashboard/stats
 * @access  Private
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const Job = require('../models/Job.model');

  // Fetch user for profile completion and plan details
  const user = await User.findById(userId).populate('subscriptionPlan');

  // Run all queries in parallel for performance
  const [
    totalResumes,
    completedResumes,
    draftResumes,
    resumeCompletionAgg,
    applicationAgg,
    activeJobsCount,
    recentResumes,
    recentApplications
  ] = await Promise.all([
    // Total resumes created by user
    Resume.countDocuments({ userId }),

    // Completed resumes
    Resume.countDocuments({ userId, status: 'Completed' }),

    // Draft resumes
    Resume.countDocuments({ userId, status: 'Draft' }),

    // Average completion percentage across all resumes
    Resume.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          avgCompletion: { $avg: '$completionPercentage' }
        }
      }
    ]),

    // Application statistics grouped by status
    Application.aggregate([
      { $match: { applicantId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]),

    // Active jobs count (jobs that are currently Active)
    Job.countDocuments({ status: 'Active' }),

    // Recent resumes (last 5)
    Resume.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('title status completionPercentage updatedAt templateId')
      .populate('templateId', 'name'),

    // Recent applications (last 5)
    Application.find({ applicantId: userId })
      .populate('jobId', 'title company location')
      .sort({ createdAt: -1 })
      .limit(5)
  ]);

  // Average completion percentage
  const avgCompletionPercentage = resumeCompletionAgg.length > 0
    ? Math.round(resumeCompletionAgg[0].avgCompletion || 0)
    : 0;

  // Format application stats
  const applicationStats = {
    total: 0,
    applied: 0,
    underReview: 0,
    shortlisted: 0,
    interviewed: 0,
    offered: 0,
    accepted: 0,
    rejected: 0,
    withdrawn: 0
  };

  applicationAgg.forEach(stat => {
    applicationStats.total += stat.count;

    switch (stat._id) {
      case 'Applied':
        applicationStats.applied = stat.count;
        break;
      case 'Under Review':
        applicationStats.underReview = stat.count;
        break;
      case 'Shortlisted':
        applicationStats.shortlisted = stat.count;
        break;
      case 'Interview Scheduled':
      case 'Interviewed':
        applicationStats.interviewed += stat.count;
        break;
      case 'Offered':
        applicationStats.offered = stat.count;
        break;
      case 'Accepted':
        applicationStats.accepted = stat.count;
        break;
      case 'Rejected':
        applicationStats.rejected = stat.count;
        break;
      case 'Withdrawn':
        applicationStats.withdrawn = stat.count;
        break;
    }
  });

  // Robust resume limit detection
  const plan = user?.subscriptionPlan;
  let resumeLimit = 3;
  if (plan) {
    resumeLimit = Math.max(plan.resumeLimit || 0, plan.maxFreeTemplates || 0) || (plan.name === 'PRO' ? -1 : 3);
  } else if (user?.planName === 'PRO') {
    resumeLimit = -1;
  }

  const stats = {
    resumesCreated: totalResumes,
    completedResumes,
    draftResumes,
    avgCompletionPercentage,
    jobsApplied: applicationStats.total,
    activeJobsCount,
    profileCompletionPercentage: user ? (user.profileCompletionPercentage || 0) : 0,
    resumeLimit,
    applicationStats,
    recentResumes,
    recentApplications
  };

  return successResponse(res, stats, 'Dashboard stats retrieved successfully');
});

/**
 * @desc    Get user's resumes
 * @route   GET /api/v1/users/resumes
 * @access  Private
 */
const getUserResumes = asyncHandler(async (req, res) => {
  const resumes = await Resume.find({ userId: req.user._id })
    .sort({ createdAt: -1 });

  return successResponse(
    res,
    { resumes, count: resumes.length },
    'Resumes retrieved successfully'
  );
});

/**
 * @desc    Get user's applications
 * @route   GET /api/v1/users/applications
 * @access  Private
 */
const getUserApplications = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  const query = { applicantId: req.user._id };
  if (status) query.status = status;

  const skip = (page - 1) * limit;

  const applications = await Application.find(query)
    .populate('jobId', 'title company location salary jobType')
    .populate('resumeId', 'title')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Application.countDocuments(query);

  return successResponse(res, {
    applications,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit)
    }
  }, 'Applications retrieved successfully');
});

/**
 * @desc    Delete user account
 * @route   DELETE /api/v1/users/account
 * @access  Private
 */
const deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return badRequestResponse(res, 'Incorrect password');
  }

  // Soft delete - deactivate account
  user.isActive = false;
  await user.save();

  // TODO: Also delete or anonymize user's data (resumes, applications)

  return successResponse(res, null, 'Account deleted successfully');
});

/**
 * @desc    Upload profile picture
 * @route   POST /api/v1/users/upload-picture
 * @access  Private
 */
const uploadProfilePicture = asyncHandler(async (req, res) => {
  if (!req.file) {
    return badRequestResponse(res, 'No file uploaded');
  }

  const user = await User.findById(req.user._id);

  // TODO: Upload to cloud storage (Cloudinary)
  // For now, just store the file path
  user.profilePicture = `/uploads/${req.file.filename}`;
  await user.save();

  return successResponse(
    res,
    { profilePicture: user.profilePicture },
    'Profile picture uploaded successfully'
  );
});

module.exports = {
  getUserProfile,
  getMyProfile,
  updateProfile,
  updatePreferences,
  getDashboardStats,
  getUserResumes,
  getUserApplications,
  deleteAccount,
  uploadProfilePicture
};