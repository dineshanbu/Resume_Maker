// backend/src/controllers/admin/adminSettings.controller.js
const AppSettings = require('../../models/AppSettings.model');
const asyncHandler = require('../../utils/asyncHandler');
const {
  successResponse,
  createdResponse,
  notFoundResponse,
  badRequestResponse
} = require('../../utils/apiResponse');

/**
 * @desc    Get all app settings
 * @route   GET /api/v1/admin/settings
 * @access  Private (Admin)
 */
const getAllSettings = asyncHandler(async (req, res) => {
  const { category } = req.query;

  const query = {};
  if (category) {
    query.category = category;
  }

  const settings = await AppSettings.find(query).sort({ category: 1, key: 1 });

  return successResponse(res, { settings }, 'Settings retrieved successfully');
});

/**
 * @desc    Get single setting by key
 * @route   GET /api/v1/admin/settings/:key
 * @access  Private (Admin)
 */
const getSettingByKey = asyncHandler(async (req, res) => {
  const { key } = req.params;

  const setting = await AppSettings.findOne({ key });

  if (!setting) {
    return notFoundResponse(res, 'Setting not found');
  }

  return successResponse(res, { setting }, 'Setting retrieved successfully');
});

/**
 * @desc    Create or update setting
 * @route   POST /api/v1/admin/settings
 * @route   PUT /api/v1/admin/settings/:key
 * @access  Private (Admin)
 */
const upsertSetting = asyncHandler(async (req, res) => {
  const { key, value, description, category } = req.body;

  if (!key || value === undefined) {
    return badRequestResponse(res, 'Key and value are required');
  }

  const setting = await AppSettings.findOneAndUpdate(
    { key },
    {
      key,
      value,
      description: description || '',
      category: category || 'general'
    },
    { new: true, upsert: true, runValidators: true }
  );

  return successResponse(
    res,
    { setting },
    'Setting saved successfully'
  );
});

/**
 * @desc    Update setting
 * @route   PUT /api/v1/admin/settings/:key
 * @access  Private (Admin)
 */
const updateSetting = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const { value, description, category } = req.body;

  const setting = await AppSettings.findOne({ key });

  if (!setting) {
    return notFoundResponse(res, 'Setting not found');
  }

  if (value !== undefined) setting.value = value;
  if (description !== undefined) setting.description = description;
  if (category !== undefined) setting.category = category;

  await setting.save();

  return successResponse(res, { setting }, 'Setting updated successfully');
});

/**
 * @desc    Delete setting
 * @route   DELETE /api/v1/admin/settings/:key
 * @access  Private (Admin)
 */
const deleteSetting = asyncHandler(async (req, res) => {
  const { key } = req.params;

  const setting = await AppSettings.findOneAndDelete({ key });

  if (!setting) {
    return notFoundResponse(res, 'Setting not found');
  }

  return successResponse(res, null, 'Setting deleted successfully');
});

/**
 * @desc    Initialize default resume URL settings
 * @route   POST /api/v1/admin/settings/init-resume-url
 * @access  Private (Admin)
 */
const initResumeUrlSettings = asyncHandler(async (req, res) => {
  const defaultSettings = [
    {
      key: 'resume_url_free_days',
      value: 3,
      description: 'Resume URL validity duration for Free plan (in days)',
      category: 'resume'
    },
    {
      key: 'resume_url_premium_days',
      value: 60,
      description: 'Resume URL validity duration for Premium plan (in days)',
      category: 'resume'
    }
  ];

  const createdSettings = [];
  for (const setting of defaultSettings) {
    const existing = await AppSettings.findOne({ key: setting.key });
    if (!existing) {
      const newSetting = await AppSettings.create(setting);
      createdSettings.push(newSetting);
    } else {
      createdSettings.push(existing);
    }
  }

  return successResponse(
    res,
    { settings: createdSettings },
    'Resume URL settings initialized successfully'
  );
});

module.exports = {
  getAllSettings,
  getSettingByKey,
  upsertSetting,
  updateSetting,
  deleteSetting,
  initResumeUrlSettings
};
