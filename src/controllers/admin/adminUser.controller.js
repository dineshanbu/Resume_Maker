// backend/src/controllers/admin/adminUser.controller.js
const User = require('../../models/User.model');
const asyncHandler = require('../../utils/asyncHandler');
const { 
  successResponse, 
  badRequestResponse,
  notFoundResponse
} = require('../../utils/apiResponse');

/**
 * @desc    Get all users (Admin)
 * @route   GET /api/v1/admin/users
 * @access  Private/Admin
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, plan, role, search } = req.query;
  
  // Build query
  const query = {};
  
  if (status && status !== 'All') {
    query.isActive = status === 'Active';
  }
  
  if (plan && plan !== 'All') {
    query.currentPlan = plan;
  }
  
  if (role && role !== 'All') {
    query.role = role;
  }
  
  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  
  const skip = (page - 1) * limit;
  
  // Get users with pagination
  const users = await User.find(query)
    .select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerificationExpires')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  // Get total count
  const total = await User.countDocuments(query);
  
  // Format users for admin view
  const formattedUsers = users.map(user => {
    const userData = user.getPublicProfile();
    return {
      ...userData,
      profileCompletionPercentage: user.profileCompletionPercentage || 0
    };
  });
  
  return successResponse(res, {
    users: formattedUsers,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit)
    }
  }, 'Users retrieved successfully');
});

/**
 * @desc    Get user details by ID (Admin)
 * @route   GET /api/v1/admin/users/:id
 * @access  Private/Admin
 */
const getUserDetails = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerificationExpires');
  
  if (!user) {
    return notFoundResponse(res, 'User not found');
  }
  
  const userData = user.getPublicProfile();
  
  return successResponse(res, {
    user: {
      ...userData,
      profileCompletionPercentage: user.profileCompletionPercentage || 0
    }
  }, 'User details retrieved successfully');
});

/**
 * @desc    Update user status (Active/Blocked)
 * @route   PATCH /api/v1/admin/users/:id/status
 * @access  Private/Admin
 */
const updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  if (!status || !['Active', 'Blocked'].includes(status)) {
    return badRequestResponse(res, 'Invalid status. Must be Active or Blocked');
  }
  
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return notFoundResponse(res, 'User not found');
  }
  
  user.isActive = status === 'Active';
  await user.save();
  
  const userData = user.getPublicProfile();
  
  return successResponse(res, {
    user: {
      ...userData,
      profileCompletionPercentage: user.profileCompletionPercentage || 0
    }
  }, `User ${status.toLowerCase()} successfully`);
});

/**
 * @desc    Update user plan
 * @route   PATCH /api/v1/admin/users/:id/plan
 * @access  Private/Admin
 */
const updateUserPlan = asyncHandler(async (req, res) => {
  const { plan } = req.body;
  
  if (!plan || !['Free', 'Basic', 'Premium'].includes(plan)) {
    return badRequestResponse(res, 'Invalid plan. Must be Free, Basic, or Premium');
  }
  
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return notFoundResponse(res, 'User not found');
  }
  
  user.currentPlan = plan;
  await user.save();
  
  const userData = user.getPublicProfile();
  
  return successResponse(res, {
    user: {
      ...userData,
      profileCompletionPercentage: user.profileCompletionPercentage || 0
    }
  }, `User plan updated to ${plan} successfully`);
});

/**
 * @desc    Get user statistics (Admin)
 * @route   GET /api/v1/admin/users/statistics
 * @access  Private/Admin
 */
const getUserStatistics = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isActive: true });
  const blockedUsers = await User.countDocuments({ isActive: false });
  const premiumUsers = await User.countDocuments({ currentPlan: 'Premium' });
  const freeUsers = await User.countDocuments({ currentPlan: 'Free' });
  
  // Average profile completion
  const users = await User.find({}).select('profileCompletionPercentage');
  const avgCompletion = users.length > 0
    ? users.reduce((sum, user) => sum + (user.profileCompletionPercentage || 0), 0) / users.length
    : 0;
  
  const stats = {
    total: totalUsers,
    active: activeUsers,
    blocked: blockedUsers,
    premium: premiumUsers,
    free: freeUsers,
    averageProfileCompletion: Math.round(avgCompletion)
  };
  
  return successResponse(res, stats, 'User statistics retrieved successfully');
});

module.exports = {
  getAllUsers,
  getUserDetails,
  updateUserStatus,
  updateUserPlan,
  getUserStatistics
};
