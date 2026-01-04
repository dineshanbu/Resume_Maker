// backend/src/controllers/auth.controller.js
const User = require('../models/User.model');
const asyncHandler = require('../utils/asyncHandler');
const { 
  successResponse, 
  createdResponse, 
  badRequestResponse,
  unauthorizedResponse 
} = require('../utils/apiResponse');
const { 
  generateTokens, 
  setTokenCookie, 
  clearTokenCookie,
  verifyRefreshToken 
} = require('../utils/generateToken');

/**
 * @desc    Register new user
 * @route   POST /api/v1/auth/signup
 * @access  Public
 */
const signup = asyncHandler(async (req, res) => {
  const { fullName, email, password, phone, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return badRequestResponse(res, 'User already exists with this email');
  }

  // Create new user
  const user = await User.create({
    fullName,
    email,
    password,
    phone,
    role: role || 'user'
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id);

  // Set token in cookie
  setTokenCookie(res, accessToken);

  // Return user data without password
  const userData = user.getPublicProfile();

  return createdResponse(res, {
    user: userData,
    accessToken,
    refreshToken
  }, 'User registered successfully');
});

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user with password field
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return unauthorizedResponse(res, 'Invalid email or password');
  }

  // Check if user is active
  if (!user.isActive) {
    return unauthorizedResponse(res, 'Your account has been deactivated');
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return unauthorizedResponse(res, 'Invalid email or password');
  }

  // Update last login
  user.lastLogin = Date.now();
  await user.save();

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id);

  // Set token in cookie
  setTokenCookie(res, accessToken);

  // Return user data without password
  const userData = user.getPublicProfile();

  return successResponse(res, {
    user: userData,
    accessToken,
    refreshToken
  }, 'Login successful');
});

/**
 * @desc    Logout user
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  // Clear token cookie
  clearTokenCookie(res);

  return successResponse(res, null, 'Logout successful');
});

/**
 * @desc    Get current user profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  return successResponse(res, { user }, 'User profile retrieved successfully');
});

/**
 * @desc    Refresh access token
 * @route   POST /api/v1/auth/refresh-token
 * @access  Public
 */
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return badRequestResponse(res, 'Refresh token is required');
  }

  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Find user
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return unauthorizedResponse(res, 'Invalid refresh token');
    }

    // Generate new tokens
    const tokens = generateTokens(user._id);

    // Set new token in cookie
    setTokenCookie(res, tokens.accessToken);

    return successResponse(res, tokens, 'Token refreshed successfully');
  } catch (error) {
    return unauthorizedResponse(res, 'Invalid or expired refresh token');
  }
});

/**
 * @desc    Update password
 * @route   PUT /api/v1/auth/update-password
 * @access  Private
 */
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Verify current password
  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    return badRequestResponse(res, 'Current password is incorrect');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Generate new tokens
  const { accessToken, refreshToken } = generateTokens(user._id);

  return successResponse(res, {
    accessToken,
    refreshToken
  }, 'Password updated successfully');
});

/**
 * @desc    Request password reset (send email with reset link)
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    // Return success even if user doesn't exist (security measure)
    return successResponse(
      res, 
      null, 
      'If your email exists, you will receive a password reset link'
    );
  }

  // TODO: Generate reset token and send email
  // For now, just return success
  return successResponse(
    res, 
    null, 
    'Password reset link sent to your email'
  );
});

/**
 * @desc    Verify email
 * @route   GET /api/v1/auth/verify-email/:token
 * @access  Public
 */
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  // TODO: Implement email verification logic
  return successResponse(res, null, 'Email verified successfully');
});

module.exports = {
  signup,
  login,
  logout,
  getCurrentUser,
  refreshToken,
  updatePassword,
  forgotPassword,
  verifyEmail
};