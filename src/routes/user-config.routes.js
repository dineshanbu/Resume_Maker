const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const {
    getUserThemes,
    getUserLayouts,
    getUserSectionMasters,
    getUserSectionLayouts,
    getUserTemplates
} = require('../controllers/user/userConfig.controller');

// All user config routes require authentication to check subscription
router.use(authenticate);

// Configuration routes for users
router.get('/themes', getUserThemes);
router.get('/layouts', getUserLayouts);
router.get('/section-masters', getUserSectionMasters);
router.get('/section-layouts', getUserSectionLayouts);
router.get('/templates', getUserTemplates);

module.exports = router;
