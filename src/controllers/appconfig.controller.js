// backend/src/controllers/appconfig.controller.js
const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/apiResponse');

// Import all master models
const ResumeSection = require('../models/ResumeSection.model');
const TemplateCategory = require('../models/TemplateCategory.model');
const JobCategory = require('../models/JobCategory.model');
const JobRole = require('../models/JobRole.model');
const EmploymentType = require('../models/EmploymentType.model');
const JobType = require('../models/JobType.model');
const ExperienceLevel = require('../models/ExperienceLevel.model');
const Skill = require('../models/Skill.model');
const Currency = require('../models/Currency.model');
const Country = require('../models/Country.model');
const State = require('../models/State.model');
const City = require('../models/City.model');
const EducationLevel = require('../models/EducationLevel.model');
const LanguageMaster = require('../models/LanguageMaster.model');
const SalaryRange = require('../models/SalaryRange.model');
const PlanMaster = require('../models/PlanMaster.model');

/**
 * @desc    Get app configuration (all master data)
 * @route   GET /api/v1/appconfig
 * @access  Public
 */
const getAppConfig = asyncHandler(async (req, res) => {
  try {
    console.log('=== AppConfig API Called ===');
    
    // Test TemplateCategory query directly (like admin does)
    const testQuery = {};
    testQuery.status = 'Active';
    const testCategories = await TemplateCategory.find(testQuery).sort({ name: 1 }).lean();
    console.log('✅ Direct TemplateCategory query test:', testCategories?.length || 0, 'items');
    if (testCategories && testCategories.length > 0) {
      console.log('Sample category:', testCategories[0]);
    }

    // Fetch all master data - match admin controller approach exactly
    // Use the same query pattern as admin controller
    const query = { status: 'Active' };
    
    console.log('Executing queries with query:', JSON.stringify(query));
    
    // Fetch queries individually with error handling to see which one fails
    let resumeSections = [];
    let templateCategories = [];
    let jobCategories = [];
    let jobRoles = [];
    let employmentTypes = [];
    let jobTypes = [];
    let experienceLevels = [];
    let skills = [];
    let currencies = [];
    let countries = [];
    let states = [];
    let cities = [];
    let educationLevels = [];
    let languages = [];
    let salaryRanges = [];
    let plans = [];

    // Execute each query separately to identify which one fails
    try {
      resumeSections = await ResumeSection.find(query).sort({ order: 1 }).lean();
      console.log('✅ ResumeSection:', resumeSections?.length || 0);
    } catch (err) {
      console.error('❌ ResumeSection error:', err.message);
    }

    try {
      templateCategories = await TemplateCategory.find(query).sort({ name: 1 }).lean();
      console.log('✅ TemplateCategory:', templateCategories?.length || 0);
      if (templateCategories && templateCategories.length > 0) {
        console.log('First category:', JSON.stringify(templateCategories[0]));
      }
    } catch (err) {
      console.error('❌ TemplateCategory error:', err.message);
      console.error('❌ TemplateCategory stack:', err.stack);
    }

    try {
      jobCategories = await JobCategory.find(query).sort({ name: 1 }).lean();
      console.log('✅ JobCategory:', jobCategories?.length || 0);
    } catch (err) {
      console.error('❌ JobCategory error:', err.message);
    }

    try {
      jobRoles = await JobRole.find(query).populate('jobCategoryId', 'name').sort({ name: 1 }).lean();
      console.log('✅ JobRole:', jobRoles?.length || 0);
    } catch (err) {
      console.error('❌ JobRole error:', err.message);
    }

    try {
      employmentTypes = await EmploymentType.find(query).sort({ name: 1 }).lean();
      console.log('✅ EmploymentType:', employmentTypes?.length || 0);
    } catch (err) {
      console.error('❌ EmploymentType error:', err.message);
    }

    try {
      jobTypes = await JobType.find(query).sort({ name: 1 }).lean();
      console.log('✅ JobType:', jobTypes?.length || 0);
    } catch (err) {
      console.error('❌ JobType error:', err.message);
    }

    try {
      experienceLevels = await ExperienceLevel.find(query).sort({ minYears: 1 }).lean();
      console.log('✅ ExperienceLevel:', experienceLevels?.length || 0);
    } catch (err) {
      console.error('❌ ExperienceLevel error:', err.message);
    }

    try {
      skills = await Skill.find(query).sort({ name: 1 }).lean();
      console.log('✅ Skill:', skills?.length || 0);
    } catch (err) {
      console.error('❌ Skill error:', err.message);
    }

    try {
      currencies = await Currency.find(query).sort({ code: 1 }).lean();
      console.log('✅ Currency:', currencies?.length || 0);
    } catch (err) {
      console.error('❌ Currency error:', err.message);
    }

    try {
      countries = await Country.find(query).sort({ name: 1 }).lean();
      console.log('✅ Country:', countries?.length || 0);
    } catch (err) {
      console.error('❌ Country error:', err.message);
    }

    try {
      states = await State.find(query).populate('countryId', 'name code').sort({ name: 1 }).lean();
      console.log('✅ State:', states?.length || 0);
    } catch (err) {
      console.error('❌ State error:', err.message);
    }

    try {
      cities = await City.find(query).populate('stateId', 'name code').populate('countryId', 'name code').sort({ name: 1 }).lean();
      console.log('✅ City:', cities?.length || 0);
    } catch (err) {
      console.error('❌ City error:', err.message);
    }

    try {
      educationLevels = await EducationLevel.find(query).sort({ levelCode: 1 }).lean();
      console.log('✅ EducationLevel:', educationLevels?.length || 0);
    } catch (err) {
      console.error('❌ EducationLevel error:', err.message);
    }

    try {
      languages = await LanguageMaster.find(query).sort({ name: 1 }).lean();
      console.log('✅ LanguageMaster:', languages?.length || 0);
    } catch (err) {
      console.error('❌ LanguageMaster error:', err.message);
    }

    try {
      salaryRanges = await SalaryRange.find(query).populate('currencyId', 'code symbol').sort({ minSalary: 1 }).lean();
      console.log('✅ SalaryRange:', salaryRanges?.length || 0);
    } catch (err) {
      console.error('❌ SalaryRange error:', err.message);
    }

    try {
      plans = await PlanMaster.find(query).sort({ name: 1 }).lean();
      console.log('✅ PlanMaster:', plans?.length || 0);
    } catch (err) {
      console.error('❌ PlanMaster error:', err.message);
    }

    console.log('✅ Query results:', {
      resumeSections: resumeSections?.length || 0,
      templateCategories: templateCategories?.length || 0,
      jobCategories: jobCategories?.length || 0,
      jobRoles: jobRoles?.length || 0,
      employmentTypes: employmentTypes?.length || 0,
      jobTypes: jobTypes?.length || 0,
      experienceLevels: experienceLevels?.length || 0,
      skills: skills?.length || 0,
      currencies: currencies?.length || 0,
      countries: countries?.length || 0,
      states: states?.length || 0,
      cities: cities?.length || 0,
      educationLevels: educationLevels?.length || 0,
      languages: languages?.length || 0,
      salaryRanges: salaryRanges?.length || 0,
      plans: plans?.length || 0
    });

    // Format data for frontend
    const config = {
      resumeSections: resumeSections || [],
      templateCategories: (templateCategories && Array.isArray(templateCategories)) ? templateCategories : [],
      jobCategories: jobCategories || [],
      jobRoles: jobRoles || [],
      employmentTypes: employmentTypes || [],
      jobTypes: jobTypes || [],
      experienceLevels: experienceLevels || [],
      skills: skills || [],
      currencies: currencies || [],
      countries: countries || [],
      states: states || [],
      cities: cities || [],
      educationLevels: educationLevels || [],
      languages: languages || [],
      salaryRanges: salaryRanges || [],
      plans: plans || [],
      
      // Helper mappings for easy access
      jobRolesByCategory: {},
      skillsByCategory: {},
      statesByCountry: {},
      citiesByState: {},
      citiesByCountry: {}
    };

    // Build job roles by category mapping
    jobRoles.forEach(role => {
      const categoryId = role.jobCategoryId?._id?.toString() || role.jobCategoryId?.toString() || 'uncategorized';
      if (!config.jobRolesByCategory[categoryId]) {
        config.jobRolesByCategory[categoryId] = [];
      }
      config.jobRolesByCategory[categoryId].push(role);
    });

    // Build skills by category mapping
    skills.forEach(skill => {
      const category = skill.category || 'uncategorized';
      if (!config.skillsByCategory[category]) {
        config.skillsByCategory[category] = [];
      }
      config.skillsByCategory[category].push(skill);
    });

    // Build states by country mapping
    states.forEach(state => {
      const countryId = state.countryId?._id?.toString() || state.countryId?.toString() || 'uncategorized';
      if (!config.statesByCountry[countryId]) {
        config.statesByCountry[countryId] = [];
      }
      config.statesByCountry[countryId].push(state);
    });

    // Build cities by state mapping
    cities.forEach(city => {
      const stateId = city.stateId?._id?.toString() || city.stateId?.toString() || 'uncategorized';
      if (!config.citiesByState[stateId]) {
        config.citiesByState[stateId] = [];
      }
      config.citiesByState[stateId].push(city);
    });

    // Build cities by country mapping
    cities.forEach(city => {
      const countryId = city.countryId?._id?.toString() || city.countryId?.toString() || 'uncategorized';
      if (!config.citiesByCountry[countryId]) {
        config.citiesByCountry[countryId] = [];
      }
      config.citiesByCountry[countryId].push(city);
    });

    // Debug: Verify template categories in config
    console.log('Config templateCategories count:', config.templateCategories?.length || 0);
    
    return successResponse(res, config, 'App configuration retrieved successfully');
  } catch (error) {
    console.error('Error fetching app config:', error);
    console.error('Error stack:', error.stack);
    // Return empty config if there's an error (graceful degradation)
    return successResponse(res, {
      resumeSections: [],
      templateCategories: [],
      jobCategories: [],
      jobRoles: [],
      employmentTypes: [],
      jobTypes: [],
      experienceLevels: [],
      skills: [],
      currencies: [],
      countries: [],
      states: [],
      cities: [],
      educationLevels: [],
      languages: [],
      salaryRanges: [],
      plans: [],
      jobRolesByCategory: {},
      skillsByCategory: {},
      statesByCountry: {},
      citiesByState: {},
      citiesByCountry: {}
    }, 'App configuration retrieved (with fallback)');
  }
});

module.exports = {
  getAppConfig
};
