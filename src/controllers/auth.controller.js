// backend/src/controllers/auth.controller.js
const User = require('../models/User.model');
const OTP = require('../models/OTP.model');
const Notification = require('../models/Notification.model');
const Resume = require('../models/Resume.model');
const Plan = require('../models/Plan.model');
const asyncHandler = require('../utils/asyncHandler');
const {
  successResponse,
  createdResponse,
  badRequestResponse,
  unauthorizedResponse,
  forbiddenResponse,
  errorResponse
} = require('../utils/apiResponse');
const { sendOTPEmail } = require('../services/email.service');
const {
  generateTokens,
  setTokenCookie,
  clearTokenCookie,
  verifyRefreshToken
} = require('../utils/generateToken');
const { OAuth2Client } = require('google-auth-library');
const path = require('path');
const fs = require('fs');

// Initialize Google OAuth2 client
let GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// Reject placeholder values
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID.includes('your-google-client-id')) {
  console.warn('✗ Environment variable GOOGLE_CLIENT_ID contains placeholder value, ignoring it');
  GOOGLE_CLIENT_ID = null;
}

if (!GOOGLE_CLIENT_ID) {
  try {
    // Try multiple possible paths
    const possiblePaths = [
      path.join(process.cwd(), 'google_signin.json'), // From project root (most reliable)
      path.join(__dirname, '../../google_signin.json'), // From src/controllers/
      path.resolve(__dirname, '../../google_signin.json') // Absolute path
    ];

    let googleConfigPath = null;
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        googleConfigPath = testPath;
        console.log('✓ Found google_signin.json at:', googleConfigPath);
        break;
      }
    }

    if (googleConfigPath) {
      // Support both top-level client_id and web.client_id
      const googleConfig = JSON.parse(fs.readFileSync(googleConfigPath, 'utf-8'));
      GOOGLE_CLIENT_ID = googleConfig.web?.client_id || googleConfig.client_id;

      if (GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.includes('your-google-client-id')) {
        console.log('✓ Google Client ID loaded from google_signin.json:', GOOGLE_CLIENT_ID);
      } else {
        console.error('✗ Invalid Client ID in google_signin.json (placeholder detected)');
        GOOGLE_CLIENT_ID = null;
      }
    } else {
      console.warn('✗ google_signin.json not found. Tried paths:', possiblePaths);
      console.warn('Current working directory:', process.cwd());
      console.warn('__dirname:', __dirname);
    }
  } catch (error) {
    console.error('✗ Unable to read google_signin.json for Google client ID:', error.message);
    console.error('Error stack:', error.stack);
  }
}

// Fallback: Hardcode the Client ID if file reading fails (for development)
if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.includes('your-google-client-id')) {
  console.warn('⚠ Using hardcoded Client ID as fallback');
  GOOGLE_CLIENT_ID = '891192652417-magnutk3gvp6rlegpgdbnl39iu9cgk2h.apps.googleusercontent.com';
  console.log('✓ Using fallback Client ID:', GOOGLE_CLIENT_ID);
}

if (!GOOGLE_CLIENT_ID) {
  console.error('✗ CRITICAL: Google Client ID is not configured!');
} else {
  console.log('✓ Google OAuth2 client initialized with Client ID:', GOOGLE_CLIENT_ID);
}

const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

/**
 * @desc    Register new user (OTP required)
 * @route   POST /api/v1/auth/signup
 * @access  Public
 */
const signup = asyncHandler(async (req, res) => {
  // Accept both first_name (from frontend) and fullName (legacy)
  const fullName = req.body.first_name || req.body.fullName;
  const { email, password, phone_no, phone, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return badRequestResponse(res, 'User already exists with this email');
  }

  // Get FREE plan to assign to new user
  const Plan = require('../models/Plan.model');
  const freePlan = await Plan.findOne({ name: 'FREE', isActive: true });
  if (!freePlan) {
    console.error('⚠️ FREE plan not found. Creating default FREE plan...');
    // Create default FREE plan if it doesn't exist
    const defaultFreePlan = await Plan.create({
      name: 'FREE',
      price: 0,
      billingCycle: 'monthly',
      isActive: true,
      features: {
        resumeCreateUnlimited: true,
        maxFreeTemplates: 5,
        premiumTemplatesAccess: false,
        resumeExportPdf: false,
        resumeExportHtml: false,
        resumeDownloadLimit: 0,
        resumeShareUrl: false,
        resumeUrlValidityDays: 0,
        autoApplyJobs: false,
        resumeAnalytics: false
      },
      description: 'Free plan with basic features'
    });
    freePlan = defaultFreePlan;
  }

  // Create new user with isVerified = false and FREE plan assigned
  const user = await User.create({
    fullName: fullName,
    email: email.toLowerCase(),
    password,
    phone: phone_no || phone || null,
    role: role || 'user',
    authProvider: ['local'],
    isVerified: false,
    currentPlan: 'Free',
    planId: freePlan._id,
    planName: 'FREE',
    planStartDate: new Date(),
    planExpiryDate: null // FREE plan has no expiry
  });

  // Generate and send OTP
  console.log('📧 Generating OTP for user:', user.email);
  const otp = await OTP.createOTP(user._id, user.email, 1); // 1 minute expiry
  console.log('✓ OTP generated:', otp.otpCode, 'for email:', user.email);

  // Send OTP email (non-blocking to prevent UI hang)
  console.log('📤 Triggering OTP email (non-blocking) for:', user.email);
  sendOTPEmail(user, otp.otpCode, 1).catch(emailError => {
    console.error('✗ CRITICAL ERROR: Failed to send OTP email in background to:', user.email);
    console.error('Error message:', emailError.message);

    if (emailError.message && emailError.message.includes('EAUTH')) {
      console.error('\n⚠ SMTP AUTHENTICATION ERROR DETECTED!');
      console.error('The email service credentials are incorrect or require App Password.');
    }
  });
  console.log('✓ Signup flow continuing while email sends in background');

  // Return success without tokens (user must verify email first)
  return successResponse(res, {
    email: user.email,
    message: 'OTP sent to your email. Please verify your email to continue.',
    // For development: include OTP in response (REMOVE IN PRODUCTION)
    ...(process.env.NODE_ENV !== 'production' && { otpCode: otp.otpCode })
  }, 'User registered successfully. Please check your email for OTP verification.');
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

  // Check if user is verified (STRICT RULE)
  if (!user.isVerified) {
    return forbiddenResponse(res, 'Please verify your email using OTP');
  }

  // Check auth provider - if user signed up with Google, they must use Google login
  const hasLocalAuth = Array.isArray(user.authProvider)
    ? user.authProvider.includes('local')
    : user.authProvider === 'local';

  const hasGoogleAuth = Array.isArray(user.authProvider)
    ? user.authProvider.includes('google')
    : user.authProvider === 'google';

  if (!hasLocalAuth && hasGoogleAuth) {
    return badRequestResponse(res, 'Please login using Google');
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return unauthorizedResponse(res, 'Invalid email or password');
  }

  // CRITICAL: Ensure user has planId assigned (fix for existing users without planId)
  if (!user.planId) {
    const Plan = require('../models/Plan.model');
    const freePlan = await Plan.findOne({ name: 'FREE', isActive: true });
    if (freePlan) {
      user.planId = freePlan._id;
      user.planName = 'FREE';
      user.currentPlan = 'Free';
      user.planStartDate = new Date();
      user.planExpiryDate = null;
      console.log(`✓ Assigned FREE plan to user ${user._id} during login (missing planId)`);
    }
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
 * @desc    Google Sign-In (ID Token based)
 * @route   POST /api/v1/auth/google
 * @access  Public
 */
const googleLogin = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  if (!googleClient || !GOOGLE_CLIENT_ID) {
    return badRequestResponse(res, 'Google Sign-In is not configured on the server');
  }

  if (!idToken) {
    return badRequestResponse(res, 'Google ID token is required');
  }

  // Log for debugging
  console.log('=== Google Sign-In Debug ===');
  console.log('Client ID from config:', GOOGLE_CLIENT_ID);
  console.log('Token received (length):', idToken ? idToken.length : 0);
  console.log('Token preview (first 50 chars):', idToken ? idToken.substring(0, 50) + '...' : 'null');

  try {
    // Decode token to check audience before verification
    try {
      const decodedToken = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
      console.log('Token audience (aud):', decodedToken.aud);
      console.log('Token issuer (iss):', decodedToken.iss);
      console.log('Expected Client ID:', GOOGLE_CLIENT_ID);

      if (decodedToken.aud && decodedToken.aud !== GOOGLE_CLIENT_ID) {
        console.error('❌ AUDIENCE MISMATCH!');
        console.error('Token was issued for:', decodedToken.aud);
        console.error('Backend expects:', GOOGLE_CLIENT_ID);
        return unauthorizedResponse(res, `Google token audience mismatch. Token issued for: ${decodedToken.aud}, but backend expects: ${GOOGLE_CLIENT_ID}`);
      }
    } catch (decodeError) {
      console.warn('Could not decode token for audience check:', decodeError.message);
    }

    // Verify ID token with Google
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    if (!payload) {
      console.error('Google token verification: payload is null');
      return unauthorizedResponse(res, 'Invalid Google token: No payload received');
    }

    // Log for debugging (remove in production)
    console.log('Google token verified successfully. Email:', payload.email, 'Client ID used:', GOOGLE_CLIENT_ID);

    const googleId = payload.sub;
    const email = payload.email;
    const fullName = payload.name || payload.given_name || payload.family_name || email;
    const picture = payload.picture;
    const emailVerified = payload.email_verified;

    if (!email) {
      return unauthorizedResponse(res, 'Google account does not have a verified email');
    }

    // Find user by googleId or email
    let user = await User.findOne({ googleId });

    if (!user) {
      user = await User.findOne({ email });
    }

    if (user) {
      // CASE A: Email exists with authProvider = "google" → Normal login
      // CASE B: Email exists with authProvider = "local" → LINK accounts
      const currentProviders = Array.isArray(user.authProvider)
        ? user.authProvider
        : [user.authProvider];

      // Add Google to providers if not already present
      if (!currentProviders.includes('google')) {
        user.authProvider = [...currentProviders, 'google'];
      }

      // Link Google ID if not already linked
      if (!user.googleId) {
        user.googleId = googleId;
      }

      // Google users are always verified
      user.isVerified = true;

      if (!user.profilePicture && picture) {
        user.profilePicture = picture;
      }

      // Ensure role and currentPlan defaults
      if (!user.role) {
        user.role = 'user';
      }
      if (!user.currentPlan) {
        user.currentPlan = 'Free';
      }

      // Assign FREE plan if not already assigned
      if (!user.planId || !user.planName) {
        const Plan = require('../models/Plan.model');
        const freePlan = await Plan.findOne({ name: 'FREE', isActive: true });
        if (freePlan) {
          user.planId = freePlan._id;
          user.planName = 'FREE';
          user.planStartDate = new Date();
          user.planExpiryDate = null;
        }
      }

      user.lastLogin = Date.now();
      await user.save();
    } else {
      // CASE C: Email does NOT exist → Auto signup
      // Get FREE plan to assign
      const Plan = require('../models/Plan.model');
      const freePlan = await Plan.findOne({ name: 'FREE', isActive: true });
      if (!freePlan) {
        // Create default FREE plan if it doesn't exist
        const defaultFreePlan = await Plan.create({
          name: 'FREE',
          price: 0,
          billingCycle: 'monthly',
          isActive: true,
          features: {
            resumeCreateUnlimited: true,
            maxFreeTemplates: 5,
            premiumTemplatesAccess: false,
            resumeExportPdf: false,
            resumeExportHtml: false,
            resumeDownloadLimit: 0,
            resumeShareUrl: false,
            resumeUrlValidityDays: 0,
            autoApplyJobs: false,
            resumeAnalytics: false
          },
          description: 'Free plan with basic features'
        });
        freePlan = defaultFreePlan;
      }

      user = await User.create({
        fullName,
        email,
        phone: null,
        password: null,
        authProvider: ['google'],
        googleId,
        profilePicture: picture || null,
        isVerified: true, // Google users are verified by default
        role: 'user',
        currentPlan: 'Free',
        planId: freePlan._id,
        planName: 'FREE',
        planStartDate: new Date(),
        planExpiryDate: null
      });
    }

    if (!user.isActive) {
      return unauthorizedResponse(res, 'Your account has been deactivated');
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Set token in cookie (same as normal login)
    setTokenCookie(res, accessToken);

    const userData = user.getPublicProfile();

    return successResponse(res, {
      user: userData,
      accessToken,
      refreshToken
    }, 'Login successful');
  } catch (error) {
    // Log the actual error for debugging
    console.error('Google token verification error:', error.message);
    console.error('Error details:', error);
    console.error('Client ID being used:', GOOGLE_CLIENT_ID);

    // Handle specific Google token errors
    if (error.message && error.message.toLowerCase().includes('expired')) {
      return unauthorizedResponse(res, 'Google token expired');
    }
    if (error.message && error.message.toLowerCase().includes('audience')) {
      return unauthorizedResponse(res, `Google token audience mismatch. Expected: ${GOOGLE_CLIENT_ID}`);
    }
    return unauthorizedResponse(res, 'Invalid Google token');
  }
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
  const userId = req.user._id;

  // Fetch user with plan populated if possible
  const user = await User.findById(userId).populate('planId');

  if (!user) {
    return badRequestResponse(res, 'User not found');
  }

  // Get unread notification count
  const unreadNotificationsCount = await Notification.countDocuments({
    userId,
    isRead: false
  });

  // Get total resume count
  const totalResumesCount = await Resume.countDocuments({
    userId
  });

  // Get 5 most recent resumes for dashboard quick access
  const recentResumes = await Resume.find({ userId })
    .sort({ updatedAt: -1 })
    .limit(5)
    .select('title status completionPercentage updatedAt templateId');

  // Prepare full response data
  const responseData = {
    user: user.getPublicProfile(),
    notificationCount: unreadNotificationsCount,
    totalResumes: totalResumesCount,
    recentResumes: recentResumes
  };

  // If user has a planId but it's not populated or needs specific info
  if (user.planId) {
    responseData.planDetails = user.planId;
  }

  return successResponse(res, responseData, 'User profile and dashboard data retrieved successfully');
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

/**
 * @desc    Send OTP to user email
 * @route   POST /api/v1/auth/send-otp
 * @access  Public
 */
const sendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return badRequestResponse(res, 'Email is required');
  }

  // Find user by email
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return badRequestResponse(res, 'User not found with this email');
  }

  // Check if user is already verified
  if (user.isVerified) {
    return badRequestResponse(res, 'Email is already verified');
  }

  // Check resend limit (max 3 resends per hour)
  const recentOTPs = await OTP.find({
    email: user.email,
    createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
  });

  const resendCount = recentOTPs.filter(otp => !otp.isUsed).length;
  if (resendCount >= 3) {
    return badRequestResponse(res, 'Maximum resend limit reached. Please try again after some time.');
  }

  // Generate and send new OTP
  console.log('📧 Resending OTP for user:', user.email);
  const otp = await OTP.createOTP(user._id, user.email, 1); // 1 minute expiry
  console.log('✓ OTP generated:', otp.otpCode, 'for email:', user.email);

  // Send OTP email (non-blocking)
  console.log('📤 Resending OTP email (non-blocking) to:', user.email);
  sendOTPEmail(user, otp.otpCode, 1).catch(emailError => {
    console.error('✗ CRITICAL ERROR: Failed to resend OTP email to:', user.email);
    console.error('Error message:', emailError.message);

    if (emailError.message && emailError.message.includes('EAUTH')) {
      console.error('\n⚠ SMTP AUTHENTICATION ERROR DETECTED!');
      console.error('The email service credentials are incorrect or require App Password.');
    }
  });

  return successResponse(res, {
    message: 'OTP sent to your email',
    email: user.email,
    // For development: include OTP in response (REMOVE IN PRODUCTION)
    ...(process.env.NODE_ENV !== 'production' && { otpCode: otp.otpCode })
  }, 'OTP sent successfully');
});

/**
 * @desc    Verify OTP and auto-login user
 * @route   POST /api/v1/auth/verify-otp
 * @access  Public
 */
const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  console.log('🔐 Verify OTP Request:', { email, otp, otpType: typeof otp, otpLength: otp?.toString().length });

  if (!email || !otp) {
    return badRequestResponse(res, 'Email and OTP are required');
  }

  // Normalize OTP to string and trim
  const normalizedOtp = String(otp).trim();
  const normalizedEmail = email.toLowerCase().trim();

  console.log('🔍 Normalized inputs:', { email: normalizedEmail, otp: normalizedOtp });

  // Verify OTP
  const verificationResult = await OTP.verifyOTP(normalizedEmail, normalizedOtp);

  console.log('📋 Verification result:', verificationResult);

  if (!verificationResult.valid) {
    return badRequestResponse(res, verificationResult.message || 'Invalid or expired OTP');
  }

  // Find user
  const user = await User.findById(verificationResult.userId);
  if (!user) {
    return badRequestResponse(res, 'User not found');
  }

  // Update user as verified
  user.isVerified = true;
  await user.save();

  // Send welcome email (async, non-blocking) - only for newly verified users
  setImmediate(async () => {
    try {
      const { sendWelcomeEmail } = require('../services/email.service');
      await sendWelcomeEmail(user);
      console.log(`✓ Welcome email sent to ${user.email}`);
    } catch (error) {
      console.warn('⚠ Error sending welcome email:', error.message);
    }
  });

  // Generate tokens and auto-login
  const { accessToken, refreshToken } = generateTokens(user._id);

  // Set token in cookie
  setTokenCookie(res, accessToken);

  // Return user data with tokens
  const userData = user.getPublicProfile();

  return successResponse(res, {
    user: userData,
    accessToken,
    refreshToken
  }, 'Email verified successfully. You are now logged in.');
});

module.exports = {
  signup,
  login,
  logout,
  getCurrentUser,
  refreshToken,
  updatePassword,
  forgotPassword,
  verifyEmail,
  googleLogin,
  sendOTP,
  verifyOTP
};