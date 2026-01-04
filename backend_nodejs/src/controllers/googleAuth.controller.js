// backend/src/controllers/googleAuth.controller.js
const passport = require('../config/passport.config');
const { generateTokens, setTokenCookie } = require('../utils/generateToken');
const { successResponse } = require('../utils/apiResponse');

/**
 * @desc    Initiate Google OAuth
 * @route   GET /api/v1/auth/google
 * @access  Public
 */
const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email']
});

/**
 * @desc    Google OAuth Callback
 * @route   GET /api/v1/auth/google/callback
 * @access  Public
 */
const googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user, info) => {
    if (err) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=authentication_failed`);
    }
    
    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_user_found`);
    }
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);
    
    // Set token in cookie
    setTokenCookie(res, accessToken);
    
    // Redirect to frontend with tokens
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/success?token=${accessToken}&refreshToken=${refreshToken}`;
    res.redirect(redirectUrl);
    
  })(req, res, next);
};

/**
 * @desc    Get Google Auth Success
 * @route   GET /api/v1/auth/google/success
 * @access  Private (via frontend callback)
 */
const googleSuccess = async (req, res) => {
  return successResponse(res, {
    user: req.user.getPublicProfile(),
    message: 'Google authentication successful'
  });
};

module.exports = {
  googleAuth,
  googleCallback,
  googleSuccess
};


// ============================================================
// backend/src/routes/auth.routes.js (UPDATED - Add these routes)
// ============================================================

// Add to existing auth.routes.js file:

const {
  googleAuth,
  googleCallback,
  googleSuccess
} = require('../controllers/googleAuth.controller');

// Google OAuth routes
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);
router.get('/google/success', authenticate, googleSuccess);