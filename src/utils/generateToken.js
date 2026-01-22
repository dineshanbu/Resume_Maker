// backend/src/utils/generateToken.js
const jwt = require('jsonwebtoken');

/**
 * Generate JWT Access Token
 */
const generateAccessToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

/**
 * Generate JWT Refresh Token
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );
};

/**
 * Generate both tokens
 */
const generateTokens = (userId) => {
  return {
    accessToken: generateAccessToken(userId),
    refreshToken: generateRefreshToken(userId)
  };
};

/**
 * Verify Access Token
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Verify Refresh Token
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(
      token, 
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

/**
 * Set token in HTTP-only cookie
 */
const setTokenCookie = (res, token, cookieName = 'accessToken') => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  };

  res.cookie(cookieName, token, cookieOptions);
};

/**
 * Clear token cookie
 */
const clearTokenCookie = (res, cookieName = 'accessToken') => {
  res.clearCookie(cookieName);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  setTokenCookie,
  clearTokenCookie
};