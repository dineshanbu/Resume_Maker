// backend/src/middlewares/checkPlan.middleware.js
const jwt = require('jsonwebtoken');

/**
 * Middleware to decode JWT and attach user plan to request.
 * Used for plan-specific logic (e.g., PDF watermark for free users).
 */
const checkPlan = (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies && req.cookies.accessToken) {
            token = req.cookies.accessToken;
        }

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (!req.user) {
                req.user = {};
            }
            req.user.plan = decoded.plan || 'free';
        }
    } catch (err) {
        // Non-fatal — default to free plan
        if (!req.user) req.user = {};
        req.user.plan = 'free';
    }

    next();
};

module.exports = { checkPlan };
