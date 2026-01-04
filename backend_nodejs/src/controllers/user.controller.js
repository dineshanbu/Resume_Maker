// backend/src/controllers/user.controller.js
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
 * @route   GET /api/v1/users/dashboard
 * @access  Private
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get resume count
  const resumeCount = await Resume.countDocuments({ userId });

  // Get application statistics
  const applications = await Application.aggregate([
    { $match: { applicantId: userId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Format application stats
  const applicationStats = {
    total: 0,
    applied: 0,
    underReview: 0,
    shortlisted: 0,
    interviewed: 0,
    offered: 0,
    rejected: 0
  };

  applications.forEach(stat => {
    applicationStats.total += stat.count;
    
    switch(stat._id) {
      case 'Applied':
        applicationStats.applied = stat.count;
        break;
      case 'Under Review':
        applicationStats.underReview = stat.count;
        break;
      case 'Shortlisted':
        applicationStats.shortlisted = stat.count;
        break;
      case 'Interviewed':
        applicationStats.interviewed = stat.count;
        break;
      case 'Offered':
        applicationStats.offered = stat.count;
        break;
      case 'Rejected':
        applicationStats.rejected = stat.count;
        break;
    }
  });

  // Get recent applications
  const recentApplications = await Application.find({ applicantId: userId })
    .populate('jobId', 'title company location')
    .sort({ createdAt: -1 })
    .limit(5);

  const stats = {
    resumeCount,
    applicationStats,
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
  updateProfile,
  updatePreferences,
  getDashboardStats,
  getUserResumes,
  getUserApplications,
  deleteAccount,
  uploadProfilePicture
};