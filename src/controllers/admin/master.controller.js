// backend/src/controllers/admin/master.controller.js
const asyncHandler = require('../../utils/asyncHandler');
const {
  successResponse,
  createdResponse,
  notFoundResponse,
  validationErrorResponse,
  badRequestResponse
} = require('../../utils/apiResponse');

// Import all master models
const ResumeSection = require('../../models/ResumeSection.model');
const TemplateCategory = require('../../models/TemplateCategory.model');
const JobCategory = require('../../models/JobCategory.model');
const JobRole = require('../../models/JobRole.model');
const EmploymentType = require('../../models/EmploymentType.model');
const ExperienceLevel = require('../../models/ExperienceLevel.model');
const Skill = require('../../models/Skill.model');
const Currency = require('../../models/Currency.model');
const Country = require('../../models/Country.model');
const EducationLevel = require('../../models/EducationLevel.model');
const LanguageMaster = require('../../models/LanguageMaster.model');
const SalaryRange = require('../../models/SalaryRange.model');
const PlanMaster = require('../../models/PlanMaster.model');

// Import additional master models
const JobType = require('../../models/JobType.model');
const State = require('../../models/State.model');
const City = require('../../models/City.model');
const EmailTemplate = require('../../models/EmailTemplate.model');
const Theme = require('../../models/Theme.model');
const SectionLayout = require('../../models/SectionLayout.model');

// Map URL type to Model
const getModelByType = (type) => {
  const modelMap = {
    'resume-sections': ResumeSection,
    'template-categories': TemplateCategory,
    'job-categories': JobCategory,
    'job-roles': JobRole,
    'employment-types': EmploymentType,
    'job-types': JobType,
    'experience-levels': ExperienceLevel,
    'skills': Skill,
    'currencies': Currency,
    'countries': Country,
    'states': State,
    'cities': City,
    'education-levels': EducationLevel,
    'languages': LanguageMaster,
    'salary-ranges': SalaryRange,
    'plans': PlanMaster,
    'email-templates': EmailTemplate,
    'themes': Theme,
    'section-layouts': SectionLayout
  };
  return modelMap[type] || null;
};

// Get validation rules for each type
const getValidationRules = (type) => {
  const rules = {
    'resume-sections': {
      required: ['name', 'order'],
      fields: { name: 'string', order: 'number', status: 'string' }
    },
    'template-categories': {
      required: ['name'],
      fields: { name: 'string', status: 'string' }
    },
    'job-categories': {
      required: ['name'],
      fields: { name: 'string', status: 'string' }
    },
    'job-roles': {
      required: ['name', 'jobCategoryId'],
      fields: { name: 'string', jobCategoryId: 'string', status: 'string' }
    },
    'employment-types': {
      required: ['name'],
      fields: { name: 'string', status: 'string' }
    },
    'experience-levels': {
      required: ['name', 'minYears', 'maxYears'],
      fields: { name: 'string', minYears: 'number', maxYears: 'number', status: 'string' }
    },
    'skills': {
      required: ['name'],
      fields: { name: 'string', category: 'string', status: 'string' }
    },
    'currencies': {
      required: ['code', 'symbol'],
      fields: { code: 'string', symbol: 'string', status: 'string' }
    },
    'countries': {
      required: ['name', 'code'],
      fields: { name: 'string', code: 'string', status: 'string' }
    },
    'job-types': {
      required: ['name'],
      fields: { name: 'string', description: 'string', status: 'string' }
    },
    'states': {
      required: ['name', 'countryId'],
      fields: { name: 'string', code: 'string', countryId: 'string', status: 'string' }
    },
    'cities': {
      required: ['name', 'stateId', 'countryId'],
      fields: { name: 'string', stateId: 'string', countryId: 'string', status: 'string' }
    },
    'education-levels': {
      required: ['name'],
      fields: { name: 'string', levelCode: 'string', status: 'string' }
    },
    'languages': {
      required: ['name'],
      fields: { name: 'string', languageCode: 'string', nativeName: 'string', status: 'string' }
    },
    'salary-ranges': {
      required: ['name', 'minSalary', 'maxSalary'],
      fields: { name: 'string', minSalary: 'number', maxSalary: 'number', currencyId: 'string', currencyName: 'string', status: 'string' }
    },
    'plans': {
      required: ['name'],
      fields: { name: 'string', planName: 'string', features: 'array', status: 'string' }
    },
    'email-templates': {
      required: ['emailType', 'subject', 'htmlContent'],
      fields: { emailType: 'string', subject: 'string', htmlContent: 'string', textContent: 'string', variables: 'array', isEnabled: 'boolean', description: 'string' }
    }
  };
  return rules[type] || { required: [], fields: {} };
};

/**
 * @desc    Get all items for a master type
 * @route   GET /api/v1/admin/masters/:type
 * @access  Private (Admin only)
 */
const getAllMasters = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const { status, search } = req.query;

  const Model = getModelByType(type);
  if (!Model) {
    return badRequestResponse(res, `Invalid master type: ${type}`);
  }

  // Build query
  const query = {};
  if (type === 'email-templates') {
    // Email templates use isEnabled instead of status
    if (status === 'Active' || status === 'true') {
      query.isEnabled = true;
    } else if (status === 'Inactive' || status === 'false') {
      query.isEnabled = false;
    }
    if (search) {
      query.$or = [
        { emailType: new RegExp(search, 'i') },
        { subject: new RegExp(search, 'i') }
      ];
    }
  } else {
    if (status === 'Active' || status === 'Inactive') {
      query.status = status;
    }
    if (search) {
      query.name = new RegExp(search, 'i');
    }
  }

  let items;
  if (type === 'job-roles') {
    items = await Model.find(query).populate('jobCategoryId', 'name').sort({ createdAt: -1 });
  } else if (type === 'salary-ranges') {
    items = await Model.find(query).populate('currencyId', 'code symbol').sort({ createdAt: -1 });
  } else {
    items = await Model.find(query).sort({ createdAt: -1 });
  }

  // Get statistics
  const total = await Model.countDocuments();
  let active, inactive;
  if (type === 'email-templates') {
    active = await Model.countDocuments({ isEnabled: true });
    inactive = await Model.countDocuments({ isEnabled: false });
  } else {
    active = await Model.countDocuments({ status: 'Active' });
    inactive = await Model.countDocuments({ status: 'Inactive' });
  }
  const filtered = items.length;

  return successResponse(res, {
    items: items.map(item => {
      const itemObj = item.toObject();
      // Add display fields for frontend compatibility
      if (type === 'resume-sections') {
        itemObj.sectionName = itemObj.name;
      } else if (type === 'template-categories' || type === 'job-categories') {
        itemObj.categoryName = itemObj.name;
      } else if (type === 'job-roles') {
        itemObj.roleName = itemObj.name;
        itemObj.jobCategoryName = itemObj.jobCategoryId?.name || '';
      } else if (type === 'employment-types') {
        itemObj.typeName = itemObj.name;
      } else if (type === 'experience-levels') {
        itemObj.levelName = itemObj.name;
      } else if (type === 'skills') {
        itemObj.skillName = itemObj.name;
      } else if (type === 'currencies') {
        itemObj.currencyCode = itemObj.code;
        itemObj.name = itemObj.code; // Frontend expects name field
      } else if (type === 'countries') {
        itemObj.countryCode = itemObj.code;
        itemObj.countryName = itemObj.name;
      } else if (type === 'education-levels') {
        itemObj.levelName = itemObj.name;
      } else if (type === 'languages') {
        itemObj.languageName = itemObj.name;
      } else if (type === 'salary-ranges') {
        itemObj.rangeName = itemObj.name;
        if (itemObj.currencyId && itemObj.currencyId.code) {
          itemObj.currencyName = itemObj.currencyId.code;
        }
      } else if (type === 'plans') {
        itemObj.planName = itemObj.name;
      }
      return itemObj;
    }),
    stats: { total, active, inactive, filtered }
  });
});

/**
 * @desc    Get single item by ID
 * @route   GET /api/v1/admin/masters/:type/:id
 * @access  Private (Admin only)
 */
const getMasterById = asyncHandler(async (req, res) => {
  const { type, id } = req.params;

  const Model = getModelByType(type);
  if (!Model) {
    return badRequestResponse(res, `Invalid master type: ${type}`);
  }

  let item;
  if (type === 'job-roles') {
    item = await Model.findById(id).populate('jobCategoryId', 'name');
  } else if (type === 'salary-ranges') {
    item = await Model.findById(id).populate('currencyId', 'code symbol');
  } else {
    item = await Model.findById(id);
  }

  if (!item) {
    return notFoundResponse(res, 'Item not found');
  }

  // Add display fields for frontend compatibility
  const itemObj = item.toObject();
  if (type === 'resume-sections') {
    itemObj.sectionName = itemObj.name;
  } else if (type === 'template-categories' || type === 'job-categories') {
    itemObj.categoryName = itemObj.name;
  } else if (type === 'job-roles') {
    itemObj.roleName = itemObj.name;
    itemObj.jobCategoryName = itemObj.jobCategoryId?.name || '';
  } else if (type === 'employment-types') {
    itemObj.typeName = itemObj.name;
  } else if (type === 'experience-levels') {
    itemObj.levelName = itemObj.name;
  } else if (type === 'skills') {
    itemObj.skillName = itemObj.name;
  } else if (type === 'currencies') {
    itemObj.currencyCode = itemObj.code;
    itemObj.name = itemObj.code;
  } else if (type === 'countries') {
    itemObj.countryCode = itemObj.code;
    itemObj.countryName = itemObj.name;
  } else if (type === 'education-levels') {
    itemObj.levelName = itemObj.name;
  } else if (type === 'languages') {
    itemObj.languageName = itemObj.name;
  } else if (type === 'salary-ranges') {
    itemObj.rangeName = itemObj.name;
    if (itemObj.currencyId && itemObj.currencyId.code) {
      itemObj.currencyName = itemObj.currencyId.code;
    }
  } else if (type === 'plans') {
    itemObj.planName = itemObj.name;
  }

  return successResponse(res, { item: itemObj });
});

/**
 * @desc    Create new master item
 * @route   POST /api/v1/admin/masters/:type
 * @access  Private (Admin only)
 */
const createMaster = asyncHandler(async (req, res) => {
  const { type } = req.params;
  let data = req.body;

  const Model = getModelByType(type);
  if (!Model) {
    return badRequestResponse(res, `Invalid master type: ${type}`);
  }

  // Map frontend field names to backend field names
  if (type === 'currencies') {
    data = {
      code: data.code || data.currencyCode,
      symbol: data.symbol,
      status: data.status || 'Active'
    };
  } else if (type === 'countries') {
    data = {
      name: data.name,
      code: data.code || data.countryCode,
      status: data.status || 'Active'
    };
  } else if (type === 'email-templates') {
    // Email templates use isEnabled instead of status
    const cleanData = {};
    const allowedFields = Object.keys(getValidationRules(type).fields);
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        cleanData[field] = data[field];
      }
    });
    // Normalize emailType to lowercase (required by schema)
    if (cleanData.emailType) {
      cleanData.emailType = cleanData.emailType.toLowerCase().trim();
    }
    // Convert status to isEnabled if provided
    if (data.status !== undefined) {
      cleanData.isEnabled = data.status === 'Active' || data.status === true || data.status === 'true';
    } else if (cleanData.isEnabled === undefined) {
      cleanData.isEnabled = true; // Default to enabled
    }
    data = cleanData;
  } else {
    // Remove display-only fields (sectionName, categoryName, etc.)
    const cleanData = {};
    const allowedFields = Object.keys(getValidationRules(type).fields);
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        cleanData[field] = data[field];
      }
    });
    if (!cleanData.status) cleanData.status = 'Active';
    data = cleanData;
  }

  // Validate required fields
  const rules = getValidationRules(type);
  const errors = [];

  rules.required.forEach(field => {
    if (!data[field] && data[field] !== 0) {
      errors.push(`${field} is required`);
    }
  });

  if (errors.length > 0) {
    return validationErrorResponse(res, errors);
  }

  // Check for duplicates (where applicable)
  if (type === 'currencies') {
    const existing = await Model.findOne({ code: data.code });
    if (existing) {
      return validationErrorResponse(res, ['Currency code already exists']);
    }
  } else if (type === 'countries') {
    const existing = await Model.findOne({ $or: [{ name: data.name }, { code: data.code }] });
    if (existing) {
      return validationErrorResponse(res, ['Country name or code already exists']);
    }
  } else if (type === 'email-templates') {
    const existing = await Model.findOne({ emailType: data.emailType });
    if (existing) {
      return validationErrorResponse(res, ['Email template with this type already exists']);
    }
  } else if (['template-categories', 'job-categories', 'employment-types', 'skills'].includes(type)) {
    const existing = await Model.findOne({ name: data.name });
    if (existing) {
      return validationErrorResponse(res, [`${type} with this name already exists`]);
    }
  }

  // Convert jobCategoryId to ObjectId if present
  if (type === 'job-roles' && data.jobCategoryId) {
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(data.jobCategoryId)) {
      return validationErrorResponse(res, ['Invalid job category ID']);
    }
    // Verify job category exists
    const JobCategory = require('../../models/JobCategory.model');
    const category = await JobCategory.findById(data.jobCategoryId);
    if (!category) {
      return validationErrorResponse(res, ['Job category not found']);
    }
  }

  // Set default status/isEnabled if not provided
  if (type === 'email-templates') {
    if (data.isEnabled === undefined) {
      data.isEnabled = true;
    }
  } else {
    if (!data.status) {
      data.status = 'Active';
    }
  }

  const item = await Model.create(data);

  // Populate if needed
  if (type === 'job-roles') {
    await item.populate('jobCategoryId', 'name');
  }

  // Add display fields for frontend compatibility
  const itemObj = item.toObject();
  if (type === 'resume-sections') {
    itemObj.sectionName = itemObj.name;
  } else if (type === 'template-categories' || type === 'job-categories') {
    itemObj.categoryName = itemObj.name;
  } else if (type === 'job-roles') {
    itemObj.roleName = itemObj.name;
    itemObj.jobCategoryName = itemObj.jobCategoryId?.name || '';
  } else if (type === 'employment-types') {
    itemObj.typeName = itemObj.name;
  } else if (type === 'experience-levels') {
    itemObj.levelName = itemObj.name;
  } else if (type === 'skills') {
    itemObj.skillName = itemObj.name;
  } else if (type === 'currencies') {
    itemObj.currencyCode = itemObj.code;
    itemObj.name = itemObj.code;
  } else if (type === 'countries') {
    itemObj.countryCode = itemObj.code;
    itemObj.countryName = itemObj.name;
  }

  return createdResponse(res, { item: itemObj }, 'Item created successfully');
});

/**
 * @desc    Update master item
 * @route   PUT /api/v1/admin/masters/:type/:id
 * @access  Private (Admin only)
 */
const updateMaster = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  let data = req.body;

  const Model = getModelByType(type);
  if (!Model) {
    return badRequestResponse(res, `Invalid master type: ${type}`);
  }

  // Map frontend field names to backend field names
  if (type === 'currencies') {
    const updateData = {};
    if (data.code || data.currencyCode) updateData.code = data.code || data.currencyCode;
    if (data.symbol) updateData.symbol = data.symbol;
    if (data.status) updateData.status = data.status;
    data = updateData;
  } else if (type === 'countries') {
    const updateData = {};
    if (data.name) updateData.name = data.name;
    if (data.code || data.countryCode) updateData.code = data.code || data.countryCode;
    if (data.status) updateData.status = data.status;
    data = updateData;
  } else if (type === 'email-templates') {
    // Email templates use isEnabled instead of status
    const cleanData = {};
    const allowedFields = Object.keys(getValidationRules(type).fields);
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        cleanData[field] = data[field];
      }
    });
    // Normalize emailType to lowercase (required by schema)
    if (cleanData.emailType) {
      cleanData.emailType = cleanData.emailType.toLowerCase().trim();
    }
    // Convert status to isEnabled if provided
    if (data.status !== undefined) {
      cleanData.isEnabled = data.status === 'Active' || data.status === true || data.status === 'true';
    }
    data = cleanData;
  } else {
    // Remove display-only fields (sectionName, categoryName, etc.)
    const cleanData = {};
    const allowedFields = Object.keys(getValidationRules(type).fields);
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        cleanData[field] = data[field];
      }
    });
    data = cleanData;
  }

  // Validate required fields (for update, check existing item first)
  const existingItem = await Model.findById(id);
  if (!existingItem) {
    return notFoundResponse(res, 'Item not found');
  }

  const rules = getValidationRules(type);
  const errors = [];

  // Merge existing data with updates for validation
  const mergedData = { ...existingItem.toObject(), ...data };
  rules.required.forEach(field => {
    if (mergedData[field] === undefined || mergedData[field] === null || mergedData[field] === '') {
      errors.push(`${field} is required`);
    }
  });

  if (errors.length > 0) {
    return validationErrorResponse(res, errors);
  }

  // Check for duplicates (excluding current item)
  if (type === 'currencies' && data.code) {
    const existing = await Model.findOne({ code: data.code, _id: { $ne: id } });
    if (existing) {
      return validationErrorResponse(res, ['Currency code already exists']);
    }
  } else if (type === 'countries' && (data.name || data.code)) {
    const query = { _id: { $ne: id } };
    if (data.name) query.name = data.name;
    if (data.code) query.code = data.code;
    const existing = await Model.findOne(query);
    if (existing) {
      return validationErrorResponse(res, ['Country name or code already exists']);
    }
  } else if (type === 'email-templates' && data.emailType) {
    const normalizedEmailType = data.emailType.toLowerCase().trim();
    const existing = await Model.findOne({ emailType: normalizedEmailType, _id: { $ne: id } });
    if (existing) {
      return validationErrorResponse(res, ['Email template with this type already exists']);
    }
  } else if (['template-categories', 'job-categories', 'employment-types', 'skills'].includes(type) && data.name) {
    const existing = await Model.findOne({ name: data.name, _id: { $ne: id } });
    if (existing) {
      return validationErrorResponse(res, [`${type} with this name already exists`]);
    }
  }

  // Convert jobCategoryId to ObjectId if present
  if (type === 'job-roles' && data.jobCategoryId) {
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(data.jobCategoryId)) {
      return validationErrorResponse(res, ['Invalid job category ID']);
    }
    // Verify job category exists
    const JobCategory = require('../../models/JobCategory.model');
    const category = await JobCategory.findById(data.jobCategoryId);
    if (!category) {
      return validationErrorResponse(res, ['Job category not found']);
    }
  }

  const item = await Model.findByIdAndUpdate(
    id,
    data,
    { new: true, runValidators: true }
  );

  if (!item) {
    return notFoundResponse(res, 'Item not found');
  }

  // Populate if needed
  if (type === 'job-roles') {
    await item.populate('jobCategoryId', 'name');
  }

  // Add display fields for frontend compatibility
  const itemObj = item.toObject();
  if (type === 'resume-sections') {
    itemObj.sectionName = itemObj.name;
  } else if (type === 'template-categories' || type === 'job-categories') {
    itemObj.categoryName = itemObj.name;
  } else if (type === 'job-roles') {
    itemObj.roleName = itemObj.name;
    itemObj.jobCategoryName = itemObj.jobCategoryId?.name || '';
  } else if (type === 'employment-types') {
    itemObj.typeName = itemObj.name;
  } else if (type === 'experience-levels') {
    itemObj.levelName = itemObj.name;
  } else if (type === 'skills') {
    itemObj.skillName = itemObj.name;
  } else if (type === 'currencies') {
    itemObj.currencyCode = itemObj.code;
    itemObj.name = itemObj.code;
  } else if (type === 'countries') {
    itemObj.countryCode = itemObj.code;
    itemObj.countryName = itemObj.name;
  }

  return successResponse(res, { item: itemObj }, 'Item updated successfully');
});

/**
 * @desc    Toggle master item status
 * @route   PATCH /api/v1/admin/masters/:type/:id/status
 * @access  Private (Admin only)
 */
const toggleMasterStatus = asyncHandler(async (req, res) => {
  const { type, id } = req.params;

  const Model = getModelByType(type);
  if (!Model) {
    return badRequestResponse(res, `Invalid master type: ${type}`);
  }

  const item = await Model.findById(id);
  if (!item) {
    return notFoundResponse(res, 'Item not found');
  }

  if (type === 'email-templates') {
    // Email templates use isEnabled instead of status
    item.isEnabled = !item.isEnabled;
    await item.save();
  } else {
    item.status = item.status === 'Active' ? 'Inactive' : 'Active';
    await item.save();
  }

  // Populate if needed
  if (type === 'job-roles') {
    await item.populate('jobCategoryId', 'name');
  }

  // Add display fields for frontend compatibility
  const itemObj = item.toObject();
  if (type === 'resume-sections') {
    itemObj.sectionName = itemObj.name;
  } else if (type === 'template-categories' || type === 'job-categories') {
    itemObj.categoryName = itemObj.name;
  } else if (type === 'job-roles') {
    itemObj.roleName = itemObj.name;
    itemObj.jobCategoryName = itemObj.jobCategoryId?.name || '';
  } else if (type === 'employment-types') {
    itemObj.typeName = itemObj.name;
  } else if (type === 'experience-levels') {
    itemObj.levelName = itemObj.name;
  } else if (type === 'skills') {
    itemObj.skillName = itemObj.name;
  } else if (type === 'currencies') {
    itemObj.currencyCode = itemObj.code;
    itemObj.name = itemObj.code;
  } else if (type === 'countries') {
    itemObj.countryCode = itemObj.code;
    itemObj.countryName = itemObj.name;
  }

  const statusMessage = type === 'email-templates'
    ? (item.isEnabled ? 'enabled' : 'disabled')
    : (item.status === 'Active' ? 'activated' : 'deactivated');

  return successResponse(
    res,
    { item: itemObj },
    `Item ${statusMessage} successfully`
  );
});

/**
 * @desc    Delete master item
 * @route   DELETE /api/v1/admin/masters/:type/:id
 * @access  Private (Admin only)
 */
const deleteMaster = asyncHandler(async (req, res) => {
  const { type, id } = req.params;

  const Model = getModelByType(type);
  if (!Model) {
    return badRequestResponse(res, `Invalid master type: ${type}`);
  }

  const item = await Model.findByIdAndDelete(id);
  if (!item) {
    return notFoundResponse(res, 'Item not found');
  }

  return successResponse(res, null, 'Item deleted successfully');
});

/**
 * @desc    Bulk upload from CSV
 * @route   POST /api/v1/admin/masters/:type/bulk-upload
 * @access  Private (Admin only)
 */
const bulkUploadMasters = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const { csvContent } = req.body; // Expect CSV content as string

  const Model = getModelByType(type);
  if (!Model) {
    return badRequestResponse(res, `Invalid master type: ${type}`);
  }

  if (!csvContent || typeof csvContent !== 'string') {
    return badRequestResponse(res, 'CSV content is required');
  }

  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length === 0) {
    return badRequestResponse(res, 'CSV file is empty');
  }

  const errors = [];
  let totalRecords = 0;
  let inserted = 0;
  let skipped = 0;

  // Helper function to parse CSV line (handles quoted values)
  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  // Process each line (skip header if present)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Skip header row
    const headerKeywords = ['name', 'order', 'code', 'symbol', 'category', 'min', 'max', 'years', 'salary', 'currency', 'level', 'language', 'native', 'feature'];
    const isHeader = i === 0 && headerKeywords.some(keyword => line.toLowerCase().includes(keyword));
    if (isHeader) {
      continue;
    }

    totalRecords++;
    const parts = parseCSVLine(line);

    let itemData = {};
    let isValid = true;

    try {
      // Parse based on master type
      switch (type) {
        case 'resume-sections':
          if (!parts[0]) {
            errors.push(`Row ${totalRecords}: Name is required`);
            isValid = false;
            break;
          }
          itemData = {
            name: parts[0],
            order: parseInt(parts[1]) || totalRecords,
            status: parts[2] || 'Active'
          };
          break;

        case 'template-categories':
        case 'job-categories':
        case 'employment-types':
          if (!parts[0]) {
            errors.push(`Row ${totalRecords}: Name is required`);
            isValid = false;
            break;
          }
          itemData = {
            name: parts[0],
            status: parts[1] || 'Active'
          };
          break;

        case 'job-roles':
          if (!parts[0] || !parts[1]) {
            errors.push(`Row ${totalRecords}: Name and Job Category ID are required`);
            isValid = false;
            break;
          }
          const mongoose = require('mongoose');
          if (!mongoose.Types.ObjectId.isValid(parts[1])) {
            errors.push(`Row ${totalRecords}: Invalid Job Category ID`);
            isValid = false;
            break;
          }
          itemData = {
            name: parts[0],
            jobCategoryId: parts[1],
            status: parts[2] || 'Active'
          };
          break;

        case 'experience-levels':
          if (!parts[0] || parts[1] === undefined || parts[2] === undefined) {
            errors.push(`Row ${totalRecords}: Name, Min Years, and Max Years are required`);
            isValid = false;
            break;
          }
          itemData = {
            name: parts[0],
            minYears: parseInt(parts[1]) || 0,
            maxYears: parseInt(parts[2]) || 0,
            status: parts[3] || 'Active'
          };
          break;

        case 'skills':
          if (!parts[0]) {
            errors.push(`Row ${totalRecords}: Skill name is required`);
            isValid = false;
            break;
          }
          itemData = {
            name: parts[0],
            category: parts[1] || 'General',
            status: parts[2] || 'Active'
          };
          break;

        case 'currencies':
          if (!parts[0] || !parts[1]) {
            errors.push(`Row ${totalRecords}: Code and Symbol are required`);
            isValid = false;
            break;
          }
          itemData = {
            code: parts[0].toUpperCase(),
            symbol: parts[1],
            status: parts[2] || 'Active'
          };
          break;

        case 'countries':
          if (!parts[0] || !parts[1]) {
            errors.push(`Row ${totalRecords}: Name and Code are required`);
            isValid = false;
            break;
          }
          itemData = {
            name: parts[0],
            code: parts[1].toUpperCase(),
            status: parts[2] || 'Active'
          };
          break;

        case 'education-levels':
          if (!parts[0]) {
            errors.push(`Row ${totalRecords}: Name is required`);
            isValid = false;
            break;
          }
          itemData = {
            name: parts[0],
            levelCode: parts[1] || '',
            status: parts[2] || 'Active'
          };
          break;

        case 'languages':
          if (!parts[0]) {
            errors.push(`Row ${totalRecords}: Name is required`);
            isValid = false;
            break;
          }
          itemData = {
            name: parts[0],
            languageCode: parts[1] || '',
            nativeName: parts[2] || '',
            status: parts[3] || 'Active'
          };
          break;

        case 'salary-ranges':
          if (!parts[0] || parts[1] === undefined || parts[2] === undefined) {
            errors.push(`Row ${totalRecords}: Name, Min Salary, and Max Salary are required`);
            isValid = false;
            break;
          }
          itemData = {
            name: parts[0],
            minSalary: parseFloat(parts[1]) || 0,
            maxSalary: parseFloat(parts[2]) || 0,
            currencyId: parts[3] || null,
            currencyName: parts[4] || '',
            status: parts[5] || 'Active'
          };
          break;

        case 'plans':
          if (!parts[0]) {
            errors.push(`Row ${totalRecords}: Name is required`);
            isValid = false;
            break;
          }
          const features = parts[1] ? parts[1].split(';').map(f => f.trim()).filter(f => f) : [];
          itemData = {
            name: parts[0],
            planName: parts[0],
            features: features,
            status: parts[2] || 'Active'
          };
          break;

        default:
          errors.push(`Row ${totalRecords}: Unsupported master type`);
          isValid = false;
      }

      if (!isValid) {
        skipped++;
        continue;
      }

      // Check for duplicates
      let existing = null;
      if (type === 'currencies') {
        existing = await Model.findOne({ code: itemData.code });
      } else if (type === 'countries') {
        existing = await Model.findOne({ $or: [{ name: itemData.name }, { code: itemData.code }] });
      } else {
        existing = await Model.findOne({ name: itemData.name });
      }

      if (existing) {
        skipped++;
        continue;
      }

      // Validate job category exists for job-roles
      if (type === 'job-roles' && itemData.jobCategoryId) {
        const JobCategory = require('../../models/JobCategory.model');
        const category = await JobCategory.findById(itemData.jobCategoryId);
        if (!category) {
          errors.push(`Row ${totalRecords}: Job Category not found`);
          skipped++;
          continue;
        }
      }

      // Validate currency exists for salary-ranges
      if (type === 'salary-ranges' && itemData.currencyId) {
        const mongoose = require('mongoose');
        if (mongoose.Types.ObjectId.isValid(itemData.currencyId)) {
          const Currency = require('../../models/Currency.model');
          const currency = await Currency.findById(itemData.currencyId);
          if (currency) {
            itemData.currencyName = currency.code;
          }
        }
      }

      await Model.create(itemData);
      inserted++;
    } catch (error) {
      skipped++;
      errors.push(`Row ${totalRecords}: ${error.message}`);
    }
  }

  return successResponse(res, {
    totalRecords,
    inserted,
    skipped,
    errors: errors.slice(0, 10) // Limit errors to first 10
  }, 'Bulk upload completed');
});

/**
 * @desc    Bulk toggle status for master items
 * @route   POST /api/v1/admin/masters/:type/bulk-toggle-status
 * @access  Private (Admin only)
 */
const bulkToggleStatusMasters = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const { ids, status } = req.body; // Array of item IDs and target status (optional)

  const Model = getModelByType(type);
  if (!Model) {
    return badRequestResponse(res, `Invalid master type: ${type}`);
  }

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return badRequestResponse(res, 'IDs array is required');
  }

  // Validate all IDs are valid ObjectIds
  const mongoose = require('mongoose');
  const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));

  if (validIds.length === 0) {
    return badRequestResponse(res, 'No valid IDs provided');
  }

  // If status is provided, set all to that status
  // Otherwise, toggle each item's status
  let updateQuery;
  if (status === 'Active' || status === 'Inactive') {
    updateQuery = { status: status };
  } else {
    // Toggle: Get current status of items and toggle them
    const items = await Model.find({ _id: { $in: validIds } });
    const activeIds = items.filter(item => item.status === 'Active').map(item => item._id);
    const inactiveIds = items.filter(item => item.status === 'Inactive').map(item => item._id);

    // Use bulkWrite to toggle status
    const bulkOps = [
      ...activeIds.map(id => ({
        updateOne: {
          filter: { _id: id },
          update: { $set: { status: 'Inactive' } }
        }
      })),
      ...inactiveIds.map(id => ({
        updateOne: {
          filter: { _id: id },
          update: { $set: { status: 'Active' } }
        }
      }))
    ];

    const result = await Model.bulkWrite(bulkOps);

    return successResponse(res, {
      updatedCount: result.modifiedCount,
      requestedCount: ids.length,
      validCount: validIds.length,
      activated: inactiveIds.length,
      deactivated: activeIds.length
    }, `${result.modifiedCount} item(s) status toggled successfully`);
  }

  // Set all to specific status
  const result = await Model.updateMany(
    { _id: { $in: validIds } },
    { $set: updateQuery }
  );

  return successResponse(res, {
    updatedCount: result.modifiedCount,
    requestedCount: ids.length,
    validCount: validIds.length,
    status: status
  }, `${result.modifiedCount} item(s) status updated to ${status} successfully`);
});

/**
 * @desc    Bulk delete master items
 * @route   POST /api/v1/admin/masters/:type/bulk-delete
 * @access  Private (Admin only)
 */
const bulkDeleteMasters = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const { ids } = req.body; // Array of item IDs

  const Model = getModelByType(type);
  if (!Model) {
    return badRequestResponse(res, `Invalid master type: ${type}`);
  }

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return badRequestResponse(res, 'IDs array is required');
  }

  // Validate all IDs are valid ObjectIds
  const mongoose = require('mongoose');
  const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));

  if (validIds.length === 0) {
    return badRequestResponse(res, 'No valid IDs provided');
  }

  // Delete all items
  const result = await Model.deleteMany({ _id: { $in: validIds } });

  return successResponse(res, {
    deletedCount: result.deletedCount,
    requestedCount: ids.length,
    validCount: validIds.length
  }, `${result.deletedCount} item(s) deleted successfully`);
});

/**
 * @desc    Send test email using template
 * @route   POST /api/v1/admin/masters/email-templates/test
 * @access  Private (Admin only)
 */
const testEmailTemplate = asyncHandler(async (req, res) => {
  const { to, emailType, variables = {} } = req.body;

  if (!to || !emailType) {
    return badRequestResponse(res, 'Email address and template type are required');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    return badRequestResponse(res, 'Invalid email address format');
  }

  try {
    const EmailTemplate = require('../../models/EmailTemplate.model');
    const { sendEmail } = require('../../services/email.service');

    // Get template (allow disabled templates for testing)
    let template = await EmailTemplate.findOne({
      emailType: emailType.toLowerCase()
    });

    if (!template) {
      return badRequestResponse(res, `Email template "${emailType}" not found. Please create it first.`);
    }

    // Check if template is disabled (warn but allow for testing)
    if (!template.isEnabled) {
      console.warn(`⚠ Test email: Template "${emailType}" is disabled, but allowing test email`);
    }

    // Replace variables in template
    const { html, text } = template.replaceVariables(variables);

    // Send email directly (bypass the sendEmailFromTemplate to allow disabled templates)
    const result = await sendEmail({
      to,
      subject: template.subject,
      html,
      text
    });

    console.log(`✓ Test email sent using template "${emailType}" to ${to}`);

    return successResponse(res, {
      messageId: result.messageId,
      to,
      emailType,
      templateEnabled: template.isEnabled
    }, 'Test email sent successfully');
  } catch (error) {
    console.error('Test email error:', error);

    // Provide more specific error messages
    if (error.code === 'EAUTH') {
      return badRequestResponse(res, 'Email authentication failed. Please check email service configuration.');
    }

    return badRequestResponse(res, error.message || 'Failed to send test email');
  }
});

module.exports = {
  getAllMasters,
  getMasterById,
  createMaster,
  updateMaster,
  toggleMasterStatus,
  deleteMaster,
  bulkUploadMasters,
  bulkDeleteMasters,
  bulkToggleStatusMasters,
  testEmailTemplate
};
