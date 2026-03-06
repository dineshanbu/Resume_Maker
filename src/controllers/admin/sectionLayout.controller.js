const SectionLayout = require('../../models/SectionLayout.model');
const asyncHandler = require('../../utils/asyncHandler');
const {
    successResponse,
    createdResponse,
    notFoundResponse,
    badRequestResponse,
    validationErrorResponse
} = require('../../utils/apiResponse');

/**
 * @desc    Create new section layout
 * @route   POST /api/v1/admin/section-layouts
 * @access  Private (Admin only)
 */
const createSectionLayout = asyncHandler(async (req, res) => {
    const { sectionType, layoutName, layoutKey, html, css, thumbnail, isPremium, isActive, category, preview_data, description } = req.body;

    // Validate required fields
    const errors = [];
    if (!sectionType) errors.push('Section type is required');
    if (!layoutName) errors.push('Layout name is required');
    if (!layoutKey) errors.push('Layout key is required');
    if (!html) errors.push('HTML content is required');

    if (errors.length > 0) {
        return validationErrorResponse(res, errors);
    }

    // Check if layoutKey is unique
    const existing = await SectionLayout.findOne({ layoutKey });
    if (existing) {
        return badRequestResponse(res, 'Layout key already exists');
    }

    const layout = await SectionLayout.create({
        sectionType,
        layoutName,
        layoutKey,
        description: description || '',
        html,
        css,
        thumbnail,
        category: category || 'standard',
        isPremium: isPremium || false,
        isActive: isActive !== undefined ? isActive : true,
        preview_data: preview_data || {}
    });

    return createdResponse(res, layout, 'Section layout created successfully');
});

/**
 * @desc    Get all section layouts
 * @route   GET /api/v1/admin/section-layouts
 * @access  Private (Admin only)
 */
const getAllSectionLayouts = asyncHandler(async (req, res) => {
    const { sectionType, isActive, category } = req.query;
    const query = {};

    if (sectionType) query.sectionType = sectionType.toLowerCase();
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (category) query.category = category;

    const layouts = await SectionLayout.find(query).sort({ sectionType: 1, layoutName: 1 });
    return successResponse(res, layouts);
});

/**
 * @desc    Get a single section layout by ID
 * @route   GET /api/v1/admin/section-layouts/:id
 * @access  Private (Admin only)
 */
const getSectionLayoutById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const layout = await SectionLayout.findById(id);

    if (!layout) {
        return notFoundResponse(res, 'Section layout not found');
    }

    return successResponse(res, layout);
});

/**
 * @desc    Update section layout
 * @route   PUT /api/v1/admin/section-layouts/:id
 * @access  Private (Admin only)
 */
const updateSectionLayout = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const layout = await SectionLayout.findById(id);
    if (!layout) {
        return notFoundResponse(res, 'Section layout not found');
    }

    // If layoutKey is changed, check uniqueness
    if (updateData.layoutKey && updateData.layoutKey !== layout.layoutKey) {
        const existing = await SectionLayout.findOne({ layoutKey: updateData.layoutKey });
        if (existing) {
            return badRequestResponse(res, 'Layout key already exists');
        }
    }

    const updatedLayout = await SectionLayout.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
    });

    return successResponse(res, updatedLayout, 'Section layout updated successfully');
});

/**
 * @desc    Delete section layout
 * @route   DELETE /api/v1/admin/section-layouts/:id
 * @access  Private (Admin only)
 */
const deleteSectionLayout = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const layout = await SectionLayout.findByIdAndDelete(id);

    if (!layout) {
        return notFoundResponse(res, 'Section layout not found');
    }

    return successResponse(res, null, 'Section layout deleted successfully');
});

/**
 * @desc    Toggle active status
 * @route   PATCH /api/v1/admin/section-layouts/:id/toggle-active
 * @access  Private (Admin only)
 */
const toggleActiveStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const layout = await SectionLayout.findById(id);

    if (!layout) {
        return notFoundResponse(res, 'Section layout not found');
    }

    layout.isActive = !layout.isActive;
    await layout.save();

    return successResponse(res, layout, `Layout ${layout.isActive ? 'activated' : 'deactivated'} successfully`);
});

/**
 * @desc    Toggle premium status
 * @route   PATCH /api/v1/admin/section-layouts/:id/toggle-premium
 * @access  Private (Admin only)
 */
const togglePremiumStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const layout = await SectionLayout.findById(id);

    if (!layout) {
        return notFoundResponse(res, 'Section layout not found');
    }

    layout.isPremium = !layout.isPremium;
    await layout.save();

    return successResponse(res, layout, `Layout marked as ${layout.isPremium ? 'premium' : 'free'} successfully`);
});

/**
 * @desc    Get active layouts by sectionType
 * @route   GET /api/v1/section-layouts/:sectionType
 * @access  Public
 */
const getActiveLayoutsByType = asyncHandler(async (req, res) => {
    const { sectionType } = req.params;
    const layouts = await SectionLayout.find({
        sectionType: sectionType.toLowerCase(),
        isActive: true
    }).sort({ layoutName: 1 });

    return successResponse(res, layouts);
});

module.exports = {
    createSectionLayout,
    getAllSectionLayouts,
    getSectionLayoutById,
    updateSectionLayout,
    deleteSectionLayout,
    toggleActiveStatus,
    togglePremiumStatus,
    getActiveLayoutsByType
};
