// backend/src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const {
  signup,
  login,
  logout,
  getCurrentUser,
  refreshToken,
  updatePassword,
  forgotPassword,
  verifyEmail
} = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { 
  signupValidation, 
  loginValidation 
} = require('../middlewares/validation.middleware');

// Public routes
router.post('/signup', signupValidation, signup);
router.post('/login', loginValidation, login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.get('/verify-email/:token', verifyEmail);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.post('/logout', logout);
router.get('/me', getCurrentUser);
router.put('/update-password', updatePassword);

module.exports = router;