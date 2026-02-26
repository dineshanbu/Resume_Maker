
const Theme = require('../../models/Theme.model');
const SectionMaster = require('../../models/SectionMaster.model');
const SectionLayout = require('../../models/SectionLayout.model');
const Template = require('../../models/Template.model');
const TemplateCategory = require('../../models/TemplateCategory.model');
const asyncHandler = require('../../utils/asyncHandler');
const { ApiResponse } = require('../../utils/apiResponse');

/**
 * Helper to get subcription filter based on user
 */
const getSubscriptionFilter = (user) => {
    // 1. Subscription-aware filtering
    const isPremium = user && user.subscriptionType === 'PREMIUM' && user.subscriptionStatus === 'ACTIVE';

    // 2. Base filter: Active status or missing field (assumed active)
    const statusQuery = {
        $or: [
            { status: 'Active' },
            { status: { $exists: false } },
            { isActive: true }
        ]
    };

    // 3. Access Type: Filter based on subscription or missing field (assumed FREE)
    const allowedTiers = isPremium ? ['FREE', 'PREMIUM', 'BOTH'] : ['FREE', 'BOTH'];
    const accessQuery = {
        $or: [
            { accessType: { $in: allowedTiers } },
            { accessType: { $exists: false } }
        ]
    };

    return {
        $and: [statusQuery, accessQuery]
    };
};

/**
 * Get available Themes for users
 * Supports ?status=Active query parameter for explicit Active filtering
 */
exports.getUserThemes = asyncHandler(async (req, res) => {
    const { status } = req.query;
    let filter;

    // If status=Active is explicitly requested, use strict Active-only filter
    if (status === 'Active') {
        const isPremium = req.user && req.user.subscriptionType === 'PREMIUM' && req.user.subscriptionStatus === 'ACTIVE';
        const allowedTiers = isPremium ? ['FREE', 'PREMIUM', 'BOTH'] : ['FREE', 'BOTH'];

        filter = {
            status: 'Active',  // STRICT: Only Active status
            $or: [
                { accessType: { $in: allowedTiers } },
                { accessType: { $exists: false } }
            ]
        };
    } else {
        // Use default subscription filter (includes Active, missing status, etc.)
        filter = getSubscriptionFilter(req.user);
    }

    const themes = await Theme.find(filter).sort({ name: 1 });
    return res.status(200).json(new ApiResponse(200, themes, 'Themes fetched successfully'));
});

/**
 * Get available Admin Layouts for users
 * Supports ?status=Active query parameter for explicit Active filtering
 */
exports.getUserLayouts = asyncHandler(async (req, res) => {
    const { status } = req.query;
    let filter;

    // If status=Active is explicitly requested, use strict Active-only filter
    if (status === 'Active') {
        const isPremium = req.user && req.user.subscriptionType === 'PREMIUM' && req.user.subscriptionStatus === 'ACTIVE';
        const allowedTiers = isPremium ? ['FREE', 'PREMIUM', 'BOTH'] : ['FREE', 'BOTH'];

        filter = {
            status: 'Active',
            $or: [
                { accessType: { $in: allowedTiers } },
                { accessType: { $exists: false } }
            ]
        };
    } else {
        filter = getSubscriptionFilter(req.user);
    }

    const layouts = [];
    return res.status(200).json(new ApiResponse(200, layouts, 'Layouts fetched successfully'));
});

/**
 * Get available Section Masters for users
 */
exports.getUserSectionMasters = asyncHandler(async (req, res) => {
    const filter = getSubscriptionFilter(req.user);
    const masters = await SectionMaster.find(filter).sort({ order: 1 });
    return res.status(200).json(new ApiResponse(200, masters, 'Section masters fetched successfully'));
});

/**
 * Get available Section Layouts for users (filtered by master or type)
 * Supports ?status=Active query parameter for explicit Active filtering
 */
exports.getUserSectionLayouts = asyncHandler(async (req, res) => {
    const { masterId, type, status } = req.query;
    let filter;

    // Build filter based on status parameter
    if (status === 'Active') {
        const isPremium = req.user && req.user.subscriptionType === 'PREMIUM' && req.user.subscriptionStatus === 'ACTIVE';
        const allowedTiers = isPremium ? ['FREE', 'PREMIUM', 'BOTH'] : ['FREE', 'BOTH'];

        filter = {
            status: 'Active',
            $or: [
                { accessType: { $in: allowedTiers } },
                { accessType: { $exists: false } }
            ]
        };
    } else {
        filter = getSubscriptionFilter(req.user);
    }

    // Add master/type filtering
    if (masterId) {
        filter.sectionMaster = masterId;
    } else if (type) {
        const master = await SectionMaster.findOne({ code: type.toUpperCase() });
        if (master) {
            filter.sectionMaster = master._id;
        }
    }

    const layouts = await SectionLayout.find(filter).populate('sectionMaster').sort({ name: 1 });
    return res.status(200).json(new ApiResponse(200, layouts, 'Section layouts fetched successfully'));
});

/**
 * Get all available Templates for users with premium marking
 */
exports.getUserTemplates = asyncHandler(async (req, res) => {
    // Users see ALL templates, but premium ones are marked
    const templates = await Template.find({ status: 'Active' })
        .populate('categoryId', 'name')
        .sort({ usageCount: -1 });

    const processedTemplates = templates.map(t => {
        const template = t.toObject();
        // Add a flag for UI to show lock icon
        const requiresPremium = template.accessType === 'PREMIUM';
        const hasPremium = req.user && req.user.subscriptionType === 'PREMIUM' && req.user.subscriptionStatus === 'ACTIVE';

        const isLocked = requiresPremium && !hasPremium;

        return {
            ...template,
            locked: isLocked
        };
    });

    return res.status(200).json(new ApiResponse(200, processedTemplates, 'Templates fetched successfully'));
});
