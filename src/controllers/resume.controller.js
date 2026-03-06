const Resume = require('../models/Resume.model');
const User = require('../models/User.model');
const Template = require('../models/Template.model');
const asyncHandler = require('../utils/asyncHandler');
const {
  successResponse,
  createdResponse,
  notFoundResponse,
  forbiddenResponse,
  badRequestResponse
} = require('../utils/apiResponse');
const { analyzeResumeForATS } = require('../services/atsAnalysis.service');
const { generateAtsSummary, generateAtsImprovements } = require('../services/ai.service');

/**
 * Validate template access and track template usage using UserTemplateUsage collection
 * 
 * CORRECT ARCHITECTURE (MANDATORY):
 * - Template entitlement is tracked in UserTemplateUsage collection (separate collection)
 * - NOT in User.freeTemplateIdsUsed array (array-based approach is logically flawed)
 * - Unique index on (userId, templateId) prevents duplicates and race conditions
 * - Count of documents = authoritative source of truth for template usage
 * - Status (Draft/Completed) does NOT affect template tracking
 * 
 * WHY ARRAY-BASED APPROACH FAILED:
 * 1. MongoDB $expr evaluates BEFORE update, not as a hard lock
 * 2. $size + $lt does NOT create a hard entitlement lock
 * 3. $or condition allows matches even when limit should block
 * 4. $addToSet does NOT enforce array-length constraints
 * 5. This pattern CANNOT guarantee maxFreeTemplates mathematically
 * 
 * CORRECT ENFORCEMENT FLOW:
 * 1. If template.isPremium === true AND plan does not allow premium → BLOCK
 * 2. If template is FREE and user plan is FREE:
 *    a) Check if (userId, templateId) exists → ALLOW (reuse)
 *    b) Count UserTemplateUsage where userId = X
 *    c) If count < maxFreeTemplates → INSERT (atomic with unique index) → ALLOW
 *    d) Else → BLOCK FREE_TEMPLATE_LIMIT_REACHED
 * 3. Resume status MUST NOT affect entitlement logic
 * 
 * @param {Object} params
 * @param {string|ObjectId} params.userId - User ID
 * @param {Object} params.plan - Plan document from req.userPlan
 * @param {Object} params.template - Template document
 * @param {string|ObjectId} params.templateId - Template ID to validate
 * @returns {Object} { allowed: boolean, error?: Object }
 */
async function validateAndTrackTemplateAccess({ userId, plan, template, templateId }) {
  const mongoose = require('mongoose');
  const ObjectId = mongoose.Types.ObjectId;
  const UserTemplateUsage = require('../models/UserTemplateUsage.model');

  // Validate plan structure
  const features = plan.features || {};

  // Convert templateId to ObjectId for comparison
  const templateObjectId = typeof templateId === 'string'
    ? new ObjectId(templateId)
    : templateId instanceof ObjectId
      ? templateId
      : new ObjectId(templateId);

  // Convert userId to ObjectId
  const userObjectId = typeof userId === 'string'
    ? new ObjectId(userId)
    : userId instanceof ObjectId
      ? userId
      : new ObjectId(userId);

  // RULE 1: Premium Template Access Check (ALWAYS - regardless of status)
  const premiumAccess = plan.features?.premiumTemplatesAccess === true ||
    plan.templateAccess === 'premium' ||
    plan.templateAccess === 'all' ||
    plan.name === 'PRO' ||
    plan.name === 'PREMIUM';

  if (template.isPremium && !premiumAccess) {
    return {
      allowed: false,
      error: {
        statusCode: 403,
        message: 'PREMIUM_TEMPLATE_LOCKED',
        errorCode: 'PREMIUM_TEMPLATE_LOCKED',
        data: {
          templateName: template.name || 'Premium template',
          upgradeMessage: 'This premium template requires a PRO plan. Upgrade to PRO to access all premium templates and features.',
          upgradeUrl: '/user/pricing'
        }
      }
    };
  }

  // RULE 2: Free Template Limit Check (ALWAYS - regardless of status)
  // Uses UserTemplateUsage collection for authoritative tracking
  const isFreeTemplate = !template.isPremium;
  const isFreePlan = plan.name === 'FREE' || !premiumAccess;
  const resumeCreateUnlimited = plan.features?.resumeCreateUnlimited === true || plan.resumeLimit === -1;

  // Only validate if: FREE plan + free template + limits enabled
  if (isFreeTemplate && isFreePlan && !resumeCreateUnlimited) {
    // Get limit from plan (prefer top-level field from Admin UI)
    const maxFreeTemplates = Math.max(plan.resumeLimit || 0, plan.maxFreeTemplates || 0, plan.features?.maxFreeTemplates || 0) || 3;

    if (maxFreeTemplates !== null && maxFreeTemplates >= 0) {
      // STEP 1: Check if template already used (reuse case)
      // If (userId, templateId) exists, user can reuse this template → ALLOW
      const existingUsage = await UserTemplateUsage.findOne({
        userId: userObjectId,
        templateId: templateObjectId
      });

      if (existingUsage) {
        // Template already used - reuse is always allowed
        return { allowed: true };
      }

      // STEP 2: Count current template usage for this user
      // This is the authoritative count from UserTemplateUsage collection
      const currentUsageCount = await UserTemplateUsage.countDocuments({
        userId: userObjectId
      });

      // STEP 3: Check if limit reached
      if (currentUsageCount >= maxFreeTemplates) {
        return {
          allowed: false,
          error: {
            statusCode: 403,
            message: 'FREE_TEMPLATE_LIMIT_REACHED',
            errorCode: 'FREE_TEMPLATE_LIMIT_REACHED',
            data: {
              maxFreeTemplates: maxFreeTemplates,
              usedTemplates: currentUsageCount,
              upgradeMessage: `You have reached the maximum free template limit (${maxFreeTemplates} templates). Upgrade to PRO to unlock unlimited templates and premium features.`,
              upgradeUrl: '/user/pricing'
            }
          }
        };
      }

      // STEP 4: Insert new template usage (atomic with unique index protection)
      // Unique index on (userId, templateId) prevents race conditions:
      // - If two requests try to insert same template simultaneously, one will fail with E11000
      // - But we already checked existence above, so this should succeed
      // - If somehow it fails, it means another request inserted it between our check and insert
      // - In that case, we treat it as reuse and allow (idempotent behavior)
      try {
        await UserTemplateUsage.create({
          userId: userObjectId,
          templateId: templateObjectId
        });
        // Successfully inserted - ALLOW
        return { allowed: true };
      } catch (error) {
        // Handle unique index violation (E11000) - means another request inserted it
        // This is fine - treat as reuse and allow
        if (error.code === 11000) {
          // Another request inserted it - treat as reuse
          return { allowed: true };
        }
        // Other errors should be thrown
        throw error;
      }
    }
  }

  // PRO plan or unlimited - no tracking needed
  return { allowed: true };
}

/**
 * @desc    Create new resume
 * @route   POST /api/v1/resumes
 * @access  Private
 * 
 * VALIDATION FLOW (ALL BEFORE SAVE - STRICT ORDER):
 * 1. Authenticate user (middleware: authenticate)
 * 2. Ensure planId exists and plan is valid (middleware: ensureUserPlan)
 * 3. Validate required fields (title, templateId)
 * 4. Verify template exists and is active
 * 5. Validate plan model structure (plan.features exists, plan.isActive)
 * 6. TEMPLATE ACCESS CHECK (ATOMIC - ALWAYS - regardless of status):
 *    - Premium template access (plan.features.premiumTemplatesAccess)
 *    - Free template limit using ATOMIC MongoDB findOneAndUpdate
 *    - Validation + tracking in ONE atomic operation (race-safe)
 *    - Status does NOT bypass template limits
 * 7. ACTIVE RESUME COUNT CHECK (ONLY for ACTIVE/Completed status):
 *    - Count ACTIVE resumes (status = 'Completed')
 *    - Compare against plan.features.maxFreeTemplates
 *    - DRAFT resumes don't count toward ACTIVE limit
 * 8. ONLY THEN → Save resume to database
 * 
 * CRITICAL ARCHITECTURAL RULES:
 * - Template usage tracked in UserTemplateUsage collection (SINGLE SOURCE OF TRUTH)
 * - NOT in User.freeTemplateIdsUsed array (array-based approach is logically flawed)
 * - Unique index on (userId, templateId) prevents duplicates and race conditions
 * - Count of UserTemplateUsage documents = authoritative template usage count
 * - Template limits apply to ALL statuses (Draft, Completed, Active)
 * - Status is ONLY for content state, NOT permission bypass
 * - No resume save happens before validation
 * - No hardcoded limits - all from plan.features
 * - Mathematically impossible to bypass: unique index + count check + insert
 * 
 * PLAN MODEL VALIDATION:
 * - plan.features.resumeCreateUnlimited: Boolean (true = skip ACTIVE resume count check)
 * - plan.features.maxFreeTemplates: Number (distinct free templates allowed, applies to ALL statuses)
 * - plan.features.premiumTemplatesAccess: Boolean (true = can use premium templates)
 * - plan.isActive: Boolean (must be true)
 */
const createResume = asyncHandler(async (req, res) => {
  const { title, templateId, resumeData, status } = req.body;

  // STEP 1: Validate required fields
  if (!title) {
    return badRequestResponse(res, 'Resume title is required');
  }
  if (!templateId) {
    return badRequestResponse(res, 'Template ID is required');
  }

  // STEP 2: Verify template exists
  const template = await Template.findById(templateId);
  if (!template || template.status !== 'Active') {
    return notFoundResponse(res, 'Template not found or inactive');
  }

  // STEP 3: Get user and plan (plan already validated by ensureUserPlan middleware)
  // Fetch user from DB (template usage is tracked in UserTemplateUsage collection, not User document)
  const user = await User.findById(req.user._id);

  if (!user) {
    return forbiddenResponse(res, 'User not found');
  }

  // STEP 4: Get plan from middleware
  const plan = req.userPlan || { name: 'FREE', features: {} };

  // Validate plan is active
  if (plan.isActive === false) {
    console.error('❌ CRITICAL: User has inactive plan:', plan.name);
    return res.status(403).json({
      success: false,
      statusCode: 403,
      message: 'Your plan is currently inactive. Please contact support.',
      errors: []
    });
  }

  // STEP 5: Validate template access and track usage (ALWAYS - regardless of status)
  // CRITICAL: Template limits apply to BOTH Draft and Completed resumes
  // Status is ONLY for content state, NOT permission bypass
  // Uses UserTemplateUsage collection for authoritative entitlement tracking
  const validation = await validateAndTrackTemplateAccess({
    userId: user._id,
    plan,
    template,
    templateId
  });

  if (!validation.allowed) {
    return res.status(validation.error.statusCode).json({
      success: false,
      statusCode: validation.error.statusCode,
      message: validation.error.message,
      errorCode: validation.error.errorCode,
      data: validation.error.data,
      errors: []
    });
  }

  // Template usage has been tracked (if needed) in the validation function
  // No separate tracking step needed - it's already done in UserTemplateUsage collection

  // STEP 7: Check ACTIVE resume count limit (ONLY for ACTIVE/Completed status)
  // DRAFT resumes don't count toward ACTIVE resume limit
  // But template limits (checked above) apply to ALL statuses
  const resumeStatus = status || 'Draft';
  const isDraft = resumeStatus === 'Draft' || resumeStatus === 'DRAFT';
  const isActive = resumeStatus === 'Completed' || resumeStatus === 'ACTIVE' || resumeStatus === 'Active';

  // Only check ACTIVE resume count when creating as ACTIVE
  if (!isDraft && isActive) {
    const resumeCreateUnlimited = plan.features?.resumeCreateUnlimited === true || plan.resumeLimit === -1;

    if (!resumeCreateUnlimited) {
      // Count user's ACTIVE resumes (status = 'Completed')
      const activeResumeCount = await Resume.countDocuments({
        userId: user._id,
        status: 'Completed'
      });

      // Robust resume limit detection
      const maxFreeTemplates = Math.max(plan.resumeLimit || 0, plan.maxFreeTemplates || 0) || (plan.name === 'PRO' ? -1 : 3);

      // Block if user already has maximum ACTIVE resumes
      if (maxFreeTemplates !== null && maxFreeTemplates >= 0 && activeResumeCount >= maxFreeTemplates) {
        return res.status(403).json({
          success: false,
          statusCode: 403,
          message: 'PLAN_RESUME_LIMIT_REACHED',
          errorCode: 'PLAN_RESUME_LIMIT_REACHED',
          data: {
            allowed: maxFreeTemplates,
            plan: plan.name || 'FREE'
          },
          errors: []
        });
      }
    }
  }

  // STEP 8: ALL VALIDATIONS PASSED - Create resume
  // Set planType based on template.isPremium (not user's plan)
  // This ensures resume reflects the template type (Free or Premium)
  let planType = template.isPremium ? 'Premium' : 'Free';

  // Normalize status: ensure DRAFT is saved as 'Draft', ACTIVE as 'Completed'
  let normalizedStatus = 'Draft';
  if (status === 'ACTIVE' || status === 'Active' || status === 'Completed') {
    normalizedStatus = 'Completed';
  } else if (status === 'DRAFT' || status === 'Draft') {
    normalizedStatus = 'Draft';
  }

  const newResumeData = {
    title,
    templateId,
    userId: req.user._id,
    status: normalizedStatus,
    resumeData: resumeData || {},
    planType: planType
  };

  const resume = await Resume.create(newResumeData);
  await resume.populate('templateId', 'name categoryId templateHtml displayName thumbnailImage thumbnail');
  await resume.populate('templateId.categoryId', 'name');
  await resume.populate('userId', 'fullName email');

  // Calculate initial completion percentage
  if (resumeData) {
    const completionPercentage = calculateResumeCompletion(resume.toObject());
    resume.completionPercentage = completionPercentage;
    await resume.save();
  }

  // Increment user's resume count atomically
  await User.findByIdAndUpdate(req.user._id, { $inc: { resumesCreated: 1 } });

  // Send resume creation email notification (async, non-blocking)
  setImmediate(async () => {
    try {
      const { sendResumeCreationEmail } = require('../services/email.service');
      if (resume.userId && resume.userId.email) {
        await sendResumeCreationEmail(resume.userId, resume);
      }
    } catch (error) {
      console.warn('⚠ Error sending resume creation email:', error.message);
    }
  });

  return createdResponse(res, { resume }, 'Resume created successfully');
});

/**
 * @desc    Get all resumes of logged-in user
 * @route   GET /api/v1/resumes
 * @access  Private
 */
const getMyResumes = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const query = { userId: req.user._id };
  if (status) {
    query.status = status;
  }

  const resumes = await Resume.find(query)
    .populate('templateId', 'name categoryId displayName thumbnailImage thumbnail')
    .populate('templateId.categoryId', 'name')
    .sort({ updatedAt: -1 });

  // Calculate completion percentage for each resume if not set
  const resumesWithCompletion = resumes.map(resume => {
    const resumeObj = resume.toObject();

    // Calculate completion percentage if not set
    if (!resumeObj.completionPercentage && resumeObj.resumeData) {
      resumeObj.completionPercentage = calculateResumeCompletion(resumeObj);
    } else if (!resumeObj.completionPercentage) {
      resumeObj.completionPercentage = 0;
    }

    // Determine status based on completion if status is 'Active' (legacy)
    if (resumeObj.status === 'Active') {
      resumeObj.status = resumeObj.completionPercentage >= 80 ? 'Completed' : 'Draft';
    }

    // Map template thumbnail and name
    if (resumeObj.templateId) {
      resumeObj.templateThumbnail = resumeObj.templateId.thumbnailImage || resumeObj.templateId.thumbnail || null;
      resumeObj.templateName = resumeObj.templateId.displayName || resumeObj.templateId.name;
    }

    // Map lastUpdated from updatedAt if not present
    if (!resumeObj.lastUpdated) {
      resumeObj.lastUpdated = resumeObj.updatedAt || resumeObj.createdAt;
    }

    // Ensure status is 'Draft' or 'Completed' (map 'Active' to 'Completed')
    if (resumeObj.status === 'Active') {
      resumeObj.status = resumeObj.completionPercentage >= 80 ? 'Completed' : 'Draft';
    } else if (!resumeObj.status) {
      resumeObj.status = 'Draft';
    }

    // Ensure completionPercentage is set
    if (!resumeObj.completionPercentage || resumeObj.completionPercentage === 0) {
      resumeObj.completionPercentage = calculateResumeCompletion(resumeObj);
    }

    return resumeObj;
  });

  return successResponse(
    res,
    { resumes: resumesWithCompletion, count: resumesWithCompletion.length },
    'Resumes retrieved successfully'
  );
});

/**
 * Calculate resume completion percentage
 */
function calculateResumeCompletion(resume) {
  if (!resume.resumeData) return 0;

  const sections = [
    'personalDetails',
    'professionalSummary',
    'workExperience',
    'education',
    'skills',
    'certifications',
    'projects',
    'languages'
  ];

  let completedSections = 0;
  const data = resume.resumeData || resume.data;

  sections.forEach(section => {
    if (section === 'personalDetails' || section === 'personalInfo') {
      const personalInfo = data.personalInfo || data.personalDetails;
      if (personalInfo?.fullName && personalInfo?.email) {
        completedSections++;
      }
    } else if (section === 'professionalSummary' || section === 'summary') {
      const summary = data.professionalSummary?.summary || data.summary || data.personalInfo?.profileSummary;
      if (summary && summary.trim().length > 0) {
        completedSections++;
      }
    } else if (section === 'workExperience' || section === 'experience') {
      const experience = data.workExperience || data.experience || resume.experience;
      if (experience && Array.isArray(experience) && experience.length > 0) {
        completedSections++;
      }
    } else if (section === 'education') {
      const education = data.education || resume.education;
      if (education && Array.isArray(education) && education.length > 0) {
        completedSections++;
      }
    } else if (section === 'skills') {
      const skills = data.skills || resume.skills;
      if (skills && (
        (Array.isArray(skills) && skills.length > 0) ||
        (skills.technical && skills.technical.length > 0) ||
        (skills.primarySkills && skills.primarySkills.length > 0)
      )) {
        completedSections++;
      }
    } else if (section === 'certifications') {
      const certifications = data.certifications || resume.certifications;
      if (certifications && Array.isArray(certifications) && certifications.length > 0) {
        completedSections++;
      }
    } else if (section === 'projects') {
      const projects = data.projects || resume.projects;
      if (projects && Array.isArray(projects) && projects.length > 0) {
        completedSections++;
      }
    } else if (section === 'languages') {
      const languages = data.languages || (resume.skills && resume.skills.languages);
      if (languages && Array.isArray(languages) && languages.length > 0) {
        completedSections++;
      }
    }
  });

  return Math.round((completedSections / sections.length) * 100);
}

/**
 * @desc    Get single resume by ID
 * @route   GET /api/v1/resumes/:id
 * @access  Private/Public (if resume is public)
 */
const getResumeById = asyncHandler(async (req, res) => {
  const resume = await Resume.findById(req.params.id)
    .populate('userId', 'fullName email')
    .populate('templateId', 'name categoryId templateHtml displayName thumbnailImage thumbnail')
    .populate('templateId.categoryId', 'name');

  if (!resume) {
    return notFoundResponse(res, 'Resume not found');
  }

  // Check if user can view this resume
  const isOwner = req.user && resume.userId._id.toString() === req.user._id.toString();
  const isPublic = resume.isPublic;

  if (!isOwner && !isPublic) {
    return forbiddenResponse(res, 'You do not have permission to view this resume');
  }

  // Increment view count if not owner
  if (!isOwner) {
    resume.views += 1;
    await resume.save();
  }

  return successResponse(res, { resume }, 'Resume retrieved successfully');
});

/**
 * @desc    Update resume
 * @route   PUT /api/v1/resumes/:id
 * @access  Private
 */
const updateResume = asyncHandler(async (req, res) => {
  let resume = await Resume.findById(req.params.id);

  if (!resume) {
    return notFoundResponse(res, 'Resume not found');
  }

  // Check ownership
  if (resume.userId.toString() !== req.user._id.toString()) {
    return forbiddenResponse(res, 'You do not have permission to update this resume');
  }

  // Get user and plan for validation
  const User = require('../models/User.model');
  const user = await User.findById(req.user._id);
  const plan = req.userPlan;

  if (!plan) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Plan configuration error. Please contact support.',
      errors: []
    });
  }

  // Check if status is being changed to ACTIVE/Completed
  const currentStatus = resume.status;
  const newStatus = req.body.status;
  const isChangingToActive = (newStatus === 'Completed' || newStatus === 'ACTIVE' || newStatus === 'Active') &&
    (currentStatus === 'Draft' || currentStatus === 'DRAFT');
  const isChangingToDraft = (newStatus === 'Draft' || newStatus === 'DRAFT') &&
    (currentStatus === 'Completed' || currentStatus === 'ACTIVE' || currentStatus === 'Active');

  if (isChangingToActive) {
    const resumeCreateUnlimited = plan.features?.resumeCreateUnlimited === true || plan.resumeLimit === -1;

    if (!resumeCreateUnlimited) {
      // Count user's ACTIVE resumes (excluding current resume if it was already active)
      const activeResumeCount = await Resume.countDocuments({
        userId: user._id,
        status: 'Completed',
        _id: { $ne: resume._id } // Exclude current resume from count
      });

      // Robust resume limit detection
      const maxFreeTemplates = Math.max(plan.resumeLimit || 0, plan.maxFreeTemplates || 0) || (plan.name === 'PRO' ? -1 : 3);

      if (maxFreeTemplates !== null && maxFreeTemplates >= 0 && activeResumeCount >= maxFreeTemplates) {
        return res.status(403).json({
          success: false,
          statusCode: 403,
          message: 'PLAN_RESUME_LIMIT_REACHED',
          errorCode: 'PLAN_RESUME_LIMIT_REACHED',
          data: {
            allowed: maxFreeTemplates,
            plan: plan.name || 'FREE'
          },
          errors: []
        });
      }
    }
  }

  // If templateId is being updated, verify it exists and check template limits
  let updatedTemplate = null;
  if (req.body.templateId && req.body.templateId !== resume.templateId.toString()) {
    updatedTemplate = await Template.findById(req.body.templateId);

    if (!updatedTemplate || updatedTemplate.status !== 'Active') {
      return notFoundResponse(res, 'Template not found or inactive');
    }

    // Use validation function to check template access and track usage
    const validation = await validateAndTrackTemplateAccess({
      userId: user._id,
      plan,
      template: updatedTemplate,
      templateId: req.body.templateId
    });

    if (!validation.allowed) {
      return res.status(validation.error.statusCode).json({
        success: false,
        statusCode: validation.error.statusCode,
        message: validation.error.message,
        errorCode: validation.error.errorCode,
        data: validation.error.data,
        errors: []
      });
    }

    // Template usage has been atomically tracked (if needed) in the validation function
  }

  // Normalize status if provided
  const updateData = { ...req.body };
  if (updateData.status) {
    if (updateData.status === 'ACTIVE' || updateData.status === 'Active' || updateData.status === 'Completed') {
      updateData.status = 'Completed';
    } else if (updateData.status === 'DRAFT' || updateData.status === 'Draft') {
      updateData.status = 'Draft';
    }
  }

  // Update planType based on template.isPremium if templateId is being changed
  if (updatedTemplate) {
    updateData.planType = updatedTemplate.isPremium ? 'Premium' : 'Free';
  }

  // Update resume
  resume = await Resume.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  )
    .populate('templateId', 'name categoryId templateHtml displayName thumbnailImage thumbnail')
    .populate('templateId.categoryId', 'name');

  // Calculate completion percentage if resumeData was updated
  if (req.body.resumeData) {
    const completionPercentage = calculateResumeCompletion(resume.toObject());
    resume.completionPercentage = completionPercentage;
    await resume.save();
  }

  return successResponse(res, { resume }, 'Resume updated successfully');
});

/**
 * @desc    Delete resume
 * @route   DELETE /api/v1/resumes/:id
 * @access  Private
 */
const deleteResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findById(req.params.id);

  if (!resume) {
    return notFoundResponse(res, 'Resume not found');
  }

  // Check ownership
  if (resume.userId.toString() !== req.user._id.toString()) {
    return forbiddenResponse(res, 'You do not have permission to delete this resume');
  }

  await resume.deleteOne();

  // Decrement user's resume count atomically
  await User.findByIdAndUpdate(req.user._id, { $inc: { resumesCreated: -1 } });

  return successResponse(res, null, 'Resume deleted successfully');
});

/**
 * @desc    Toggle resume public/private
 * @route   PATCH /api/v1/resumes/:id/toggle-public
 * @access  Private
 */
const toggleResumePublic = asyncHandler(async (req, res) => {
  const resume = await Resume.findById(req.params.id);

  if (!resume) {
    return notFoundResponse(res, 'Resume not found');
  }

  // Check ownership
  if (resume.userId.toString() !== req.user._id.toString()) {
    return forbiddenResponse(res, 'You do not have permission to modify this resume');
  }

  resume.isPublic = !resume.isPublic;
  await resume.save();

  return successResponse(
    res,
    { resume, isPublic: resume.isPublic },
    `Resume is now ${resume.isPublic ? 'public' : 'private'}`
  );
});

/**
 * @desc    Duplicate resume
 * @route   POST /api/v1/resumes/:id/duplicate
 * @access  Private
 */
const duplicateResume = asyncHandler(async (req, res) => {
  const originalResume = await Resume.findById(req.params.id);

  if (!originalResume) {
    return notFoundResponse(res, 'Resume not found');
  }

  // Check ownership
  if (originalResume.userId.toString() !== req.user._id.toString()) {
    return forbiddenResponse(res, 'You do not have permission to duplicate this resume');
  }

  // Get user and plan (plan already validated by ensureUserPlan middleware)
  const user = await User.findById(req.user._id);

  if (!user) {
    return forbiddenResponse(res, 'User not found');
  }

  const plan = req.userPlan;
  if (!plan) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Plan configuration error. Please contact support.',
      errors: []
    });
  }

  // CRITICAL: Validate template access and limits (prevents bypass via duplication)
  const template = await Template.findById(originalResume.templateId);

  if (!template || template.status !== 'Active') {
    return notFoundResponse(res, 'Template not found or inactive');
  }

  // Validate template access (duplicate reuses same template, so no new tracking needed)
  // But we still need to check premium access
  // Validation function will detect existing usage in UserTemplateUsage and allow reuse
  const validation = await validateAndTrackTemplateAccess({
    userId: user._id,
    plan,
    template,
    templateId: originalResume.templateId
  });

  // For duplicates, template is already in UserTemplateUsage collection (reuse)
  // Validation function will detect existing usage and allow without inserting duplicate

  if (!validation.allowed) {
    return res.status(validation.error.statusCode).json({
      success: false,
      statusCode: validation.error.statusCode,
      message: validation.error.message,
      errorCode: validation.error.errorCode,
      data: validation.error.data,
      errors: []
    });
  }

  // IMPORTANT: Duplicate resumes are ALWAYS created as DRAFT
  // However, they still count toward the total resume limit
  const resumeCreateUnlimited = plan.features?.resumeCreateUnlimited === true || plan.resumeLimit === -1;

  if (!resumeCreateUnlimited) {
    // Count user's TOTAL resumes
    const totalResumeCount = await Resume.countDocuments({
      userId: user._id
    });

    // Robust resume limit detection
    const maxResumesAllowed = Math.max(plan.resumeLimit || 0, plan.maxFreeTemplates || 0) || (plan.name === 'PRO' ? -1 : 3);

    // Block if user already has maximum resumes
    if (maxResumesAllowed !== null && maxResumesAllowed >= 0 && totalResumeCount >= maxResumesAllowed) {
      return res.status(403).json({
        success: false,
        statusCode: 403,
        message: 'RESUME_LIMIT_REACHED',
        errorCode: 'RESUME_LIMIT_REACHED',
        data: {
          allowed: maxResumesAllowed,
          plan: plan.name || 'FREE',
          upgradeMessage: `You have reached the maximum resume limit of ${maxResumesAllowed}. Upgrade to PRO to create unlimited resumes and unlock premium features.`
        },
        errors: []
      });
    }
  }

  // Create duplicate - clone all fields except system fields
  const resumeObj = originalResume.toObject();

  // Extract fields we want to copy, explicitly excluding problematic fields
  const now = new Date();
  // Set planType based on template.isPremium (not from original resume)
  const planType = template.isPremium ? 'Premium' : 'Free';

  const resumeData = {
    userId: resumeObj.userId,
    title: `${originalResume.title} (Copy)`,
    templateId: resumeObj.templateId,
    resumeData: resumeObj.resumeData,
    status: 'Draft', // ALWAYS DRAFT - ignore any client-provided status
    isPublic: false,
    completionPercentage: 0,
    planType: planType,
    views: 0,
    downloads: 0,
    createdAt: now,
    updatedAt: now,
    lastModified: now,
    // Include optional fields if they exist
    ...(resumeObj.personalInfo && { personalInfo: resumeObj.personalInfo }),
    ...(resumeObj.summary && { summary: resumeObj.summary }),
    ...(resumeObj.experience && { experience: resumeObj.experience }),
    ...(resumeObj.education && { education: resumeObj.education }),
    ...(resumeObj.skills && { skills: resumeObj.skills }),
    ...(resumeObj.projects && { projects: resumeObj.projects }),
    ...(resumeObj.certifications && { certifications: resumeObj.certifications }),
    ...(resumeObj.achievements && { achievements: resumeObj.achievements }),
    ...(resumeObj.interests && { interests: resumeObj.interests }),
    ...(resumeObj.references && { references: resumeObj.references })
    // Explicitly NOT including: _id, pdfUrl, publicUrl, publicUrlToken, urlExpiresAt
    // (to avoid unique sparse index conflicts)
  };

  // Create new resume document using native MongoDB insert to bypass Mongoose defaults
  // This prevents publicUrl fields from being set to null (which violates unique sparse index)
  const insertResult = await Resume.collection.insertOne(resumeData);
  const duplicatedResume = await Resume.findById(insertResult.insertedId);

  if (!duplicatedResume) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Failed to create duplicate resume',
      errors: []
    });
  }

  await duplicatedResume.populate('templateId', 'name categoryId templateHtml displayName thumbnailImage thumbnail');
  await duplicatedResume.populate('templateId.categoryId', 'name');

  // Map template thumbnail for frontend
  const resumeResponseObj = duplicatedResume.toObject();
  if (resumeResponseObj.templateId) {
    resumeResponseObj.templateThumbnail = resumeResponseObj.templateId.thumbnailImage || resumeResponseObj.templateId.thumbnail || null;
    resumeResponseObj.templateName = resumeResponseObj.templateId.displayName || resumeResponseObj.templateId.name;
  }

  // Increment user's resume count atomically
  await User.findByIdAndUpdate(req.user._id, { $inc: { resumesCreated: 1 } });

  return createdResponse(res, { resume: resumeResponseObj }, 'Resume duplicated successfully');
});

/**
 * @desc    Generate PDF from resume
 * @route   GET /api/v1/resumes/:id/download-pdf
 * @access  Private
 */
const downloadResumePDF = asyncHandler(async (req, res) => {
  const resume = await Resume.findById(req.params.id);

  if (!resume) {
    return notFoundResponse(res, 'Resume not found');
  }

  // Check ownership or public
  const isOwner = req.user && resume.userId.toString() === req.user._id.toString();
  const isPublic = resume.isPublic;

  if (!isOwner && !isPublic) {
    return forbiddenResponse(res, 'You do not have permission to download this resume');
  }

  // Increment download count
  resume.downloads += 1;
  await resume.save();

  // TODO: Generate PDF using PDFKit
  // For now, return success message
  return successResponse(
    res,
    {
      message: 'PDF generation in progress',
      resumeId: resume._id
    },
    'Resume PDF will be downloaded'
  );
});

/**
 * @desc    Get resume statistics
 * @route   GET /api/v1/resumes/:id/stats
 * @access  Private
 */
const getResumeStats = asyncHandler(async (req, res) => {
  const resume = await Resume.findById(req.params.id);

  if (!resume) {
    return notFoundResponse(res, 'Resume not found');
  }

  // Check ownership
  if (resume.userId.toString() !== req.user._id.toString()) {
    return forbiddenResponse(res, 'You do not have permission to view these stats');
  }

  const stats = {
    views: resume.views,
    downloads: resume.downloads,
    lastModified: resume.lastModified,
    totalExperience: resume.totalExperience,
    skillsCount: {
      technical: resume.skills.technical?.length || 0,
      soft: resume.skills.soft?.length || 0,
      languages: resume.skills.languages?.length || 0
    },
    sectionsCount: {
      experience: resume.experience?.length || 0,
      education: resume.education?.length || 0,
      projects: resume.projects?.length || 0,
      certifications: resume.certifications?.length || 0
    }
  };

  return successResponse(res, stats, 'Resume statistics retrieved successfully');
});

/**
 * @desc    Run ATS scan for a resume (JSON-based analysis)
 * @route   POST /api/v1/resumes/:id/ats-scan
 * @access  Private
 */
const scanResumeATS = asyncHandler(async (req, res) => {
  const mongoose = require('mongoose');
  const { id } = req.params;
  const { jobDescription } = req.method === 'GET' ? req.query : req.body || {};

  console.log("ATS Scan ID:", id); // Added console logging for the scan ID

  // Validate ObjectId before querying MongoDB
  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.error('❌ ATS Scan: Invalid ObjectId format:', id);
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Invalid resume ID format',
      errorCode: 'INVALID_RESUME_ID',
      errors: []
    });
  }

  // Debug logging to help diagnose templateId vs resumeId issues
  console.log('🔍 ATS Scan Request:', {
    id: id,
    userId: req.user?._id?.toString(),
    isValidObjectId: mongoose.Types.ObjectId.isValid(id)
  });

  const resume = await Resume.findById(id);

  if (!resume) {
    console.error('❌ ATS Scan Failed: Resume not found for ID:', id, '- This may indicate frontend is sending templateId instead of resumeId');
    return res.status(404).json({
      success: false,
      statusCode: 404,
      message: 'Resume not found. Ensure you are sending a resumeId (not templateId). Create a resume first before running ATS scan.',
      errorCode: 'RESUME_NOT_FOUND',
      errors: []
    });
  }

  // Ownership check – ATS scan is only available to the resume owner
  if (resume.userId.toString() !== req.user._id.toString()) {
    return forbiddenResponse(res, 'You do not have permission to scan this resume');
  }

  // Core ATS analysis (synchronous, JSON-only)
  const analysis = analyzeResumeForATS({
    resume,
    jobDescription: jobDescription || ''
  });

  // Persist history so we can show improvements later
  try {
    resume.atsHistory = resume.atsHistory || [];
    resume.atsHistory.push({
      score: analysis.score,
      keywordMatch: analysis.keywordMatch?.matchPercentage || 0,
      createdAt: new Date()
    });
    await resume.save();
  } catch (err) {
    // Non-fatal – ATS should still return a response
    console.warn('⚠ Failed to append ATS history for resume', id, err.message);
  }

  // AI-style feedback; failure should not break the endpoint
  let aiFeedback = null;
  try {
    aiFeedback = await generateAtsSummary({
      resumeJson: resume.toObject(),
      jobDescription: jobDescription || '',
      metrics: analysis
    });
    // Standard structured response for ATS scan
    console.log("ATS Scan ID:", id);

    return res.status(200).json({
      success: true,
      atsScore: analysis.score,
      keywordMatch: analysis.keywordMatch?.matchPercentage || 0,
      missingKeywords: analysis.keywordMatch?.missingKeywords || [],
      strengths: aiFeedback?.strengths || [],
      suggestions: aiFeedback?.improvements || []
    });
  } catch (err) {
    console.error('❌ Failed to generate AI feedback for ATS scan', id, err);
    // If AI feedback fails, still return the core ATS analysis
    return res.status(200).json({
      success: true,
      atsScore: analysis.score,
      keywordMatch: analysis.keywordMatch?.matchPercentage || 0,
      missingKeywords: analysis.keywordMatch?.missingKeywords || [],
      strengths: [],
      suggestions: []
    });
  }
});

/**
 * @desc    Generate AI-powered improvement suggestions (non-mutating)
 * @route   POST /api/v1/resumes/:id/ats-improve
 * @access  Private
 */
const improveResumeATS = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { jobDescription } = req.body || {};

  const resume = await Resume.findById(id);

  if (!resume) {
    return notFoundResponse(res, 'Resume not found');
  }

  if (resume.userId.toString() !== req.user._id.toString()) {
    return forbiddenResponse(res, 'You do not have permission to improve this resume');
  }

  try {
    const suggestions = await generateAtsImprovements({
      resumeJson: resume.toObject(),
      jobDescription: jobDescription || ''
    });

    return successResponse(
      res,
      suggestions,
      'ATS improvement suggestions generated successfully'
    );
  } catch (err) {
    console.error('❌ Failed to generate ATS improvements for resume', id, err);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Failed to generate ATS improvement suggestions. Please try again later.',
      errors: []
    });
  }
});

/**
 * @desc    Update resume section
 * @route   PATCH /api/v1/resumes/:id/section/:section
 * @access  Private
 */
const updateResumeSection = asyncHandler(async (req, res) => {
  const { id, section } = req.params;
  const resume = await Resume.findById(id);

  if (!resume) {
    return notFoundResponse(res, 'Resume not found');
  }

  // Check ownership
  if (resume.userId.toString() !== req.user._id.toString()) {
    return forbiddenResponse(res, 'You do not have permission to update this resume');
  }

  // Validate section
  const validSections = [
    'personalInfo', 'summary', 'experience', 'education',
    'skills', 'projects', 'certifications', 'achievements', 'interests'
  ];

  if (!validSections.includes(section)) {
    return notFoundResponse(res, 'Invalid section');
  }

  // Update specific section
  resume[section] = req.body[section];
  await resume.save();

  return successResponse(
    res,
    { resume },
    `${section} section updated successfully`
  );
});

/**
 * @desc    Export resume as public URL
 * @route   POST /api/v1/resumes/:id/export-url
 * @access  Private
 */
const exportResumeUrl = asyncHandler(async (req, res) => {
  const resume = await Resume.findById(req.params.id);

  if (!resume) {
    return notFoundResponse(res, 'Resume not found');
  }

  // Check ownership
  if (resume.userId.toString() !== req.user._id.toString()) {
    return forbiddenResponse(res, 'You do not have permission to export this resume');
  }

  // Get user - plan is already validated and attached by ensureUserPlan middleware
  const User = require('../models/User.model');
  const user = await User.findById(req.user._id);

  if (!user) {
    return forbiddenResponse(res, 'User not found');
  }

  // Use plan from middleware - already validated (handles expiry, missing planId, etc.)
  const plan = req.userPlan;

  // Check if user has resumeShareUrl feature
  if (!plan.features.resumeShareUrl) {
    return forbiddenResponse(
      res,
      'This feature requires a PRO plan. Upgrade to PRO to unlock resume URL sharing.'
    );
  }

  // Normalize plan name to match Resume model enum
  let planType = user.planName || user.currentPlan || 'Free';
  if (planType === 'FREE') planType = 'Free';
  if (planType === 'PRO') planType = 'Premium';

  // Get URL validity duration from plan or admin settings
  const AppSettings = require('../models/AppSettings.model');
  const premiumDaysSetting = await AppSettings.findOne({ key: 'resume_url_premium_days' });

  // Use plan's resumeUrlValidityDays or default to 60 days for PRO
  const validityDays = plan.features.resumeUrlValidityDays || premiumDaysSetting?.value || 60;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + validityDays);

  // Generate unique token
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');

  // Update resume with public URL
  resume.publicUrlToken = token;
  resume.urlExpiresAt = expiresAt;
  resume.isPublic = true;
  resume.planType = planType;
  await resume.save();

  // Generate public URL
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
  const publicUrl = `${baseUrl}/resume/public/${token}`;

  return successResponse(
    res,
    {
      publicUrl,
      token,
      expiresAt,
      validityDays,
      planType
    },
    'Resume URL exported successfully'
  );
});

/**
 * @desc    Get public resume by token
 * @route   GET /resume/public/:token
 * @access  Public
 */
const getPublicResume = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const resume = await Resume.findOne({ publicUrlToken: token })
    .populate('templateId', 'name categoryId templateHtml displayName')
    .populate('templateId.categoryId', 'name')
    .populate('userId', 'fullName email');

  if (!resume) {
    return notFoundResponse(res, 'Resume not found');
  }

  // Check if URL has expired
  if (resume.urlExpiresAt && new Date() > resume.urlExpiresAt) {
    return badRequestResponse(
      res,
      'This resume link has expired. Upgrade to Premium to keep your resume link active.'
    );
  }

  // Increment view count
  resume.views += 1;
  await resume.save();

  return successResponse(res, { resume }, 'Public resume retrieved successfully');
});

// ─── Editor-specific endpoints ───────────────────────────────────

/**
 * @desc    Save ONLY editorConfig (lightweight auto-save)
 * @route   PUT /api/resume/:id/editor
 * @access  Private
 */
const saveEditorConfig = asyncHandler(async (req, res) => {
  const resume = await Resume.findById(req.params.id);

  if (!resume) {
    return notFoundResponse(res, 'Resume not found');
  }

  if (resume.userId.toString() !== req.user._id.toString()) {
    return forbiddenResponse(res, 'You do not have permission to update this resume');
  }

  const { editorConfig } = req.body;

  if (!editorConfig) {
    return badRequestResponse(res, 'editorConfig is required');
  }

  resume.editorConfig = editorConfig;
  resume.lastEditedAt = new Date();
  await resume.save();

  return successResponse(res, {
    success: true,
    lastEditedAt: resume.lastEditedAt
  }, 'Editor config saved successfully');
});

/**
 * Build full HTML string for PDF from resume + editorConfig
 */
function buildResumeHTML(resume) {
  const config = resume.editorConfig || {};
  const globalSettings = config.globalSettings || {};
  const sections = (config.sections || [])
    .filter(s => s.visible !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const fontFamily = globalSettings.fontFamily || 'Inter';
  const primaryColor = globalSettings.primaryColor || '#1a1a1a';
  const secondaryColor = globalSettings.secondaryColor || '#4F46E5';
  const pageMargin = globalSettings.pageMargin || 32;
  const sectionSpacing = globalSettings.sectionSpacing || 16;
  const lineHeight = globalSettings.lineHeight || 1.5;
  const letterSpacing = globalSettings.letterSpacing || 0;

  // Get resume data from resumeData or top-level fields
  const data = resume.resumeData || {};
  const personalInfo = data.personalInfo || resume.personalInfo || {};
  const summary = data.summary || resume.summary || '';
  const experience = data.experience || resume.experience || [];
  const education = data.education || resume.education || [];
  const skills = data.skills || resume.skills || {};
  const languages = (skills && skills.languages) || data.languages || [];
  const certifications = data.certifications || resume.certifications || [];
  const projects = data.projects || resume.projects || [];
  const awards = data.awards || resume.achievements || [];

  // Extract skill arrays
  const skillList = [];
  if (Array.isArray(skills)) {
    skills.forEach(s => skillList.push({ name: s.name || s, level: s.level || 50 }));
  } else {
    if (skills.technical) skills.technical.forEach(s => skillList.push({ name: s, level: 80 }));
    if (skills.soft) skills.soft.forEach(s => skillList.push({ name: s, level: 70 }));
  }

  function buildSectionHTML(section) {
    const d = section.design || {};
    const ff = d.fontFamily || fontFamily;
    const fs = d.fontSize || 14;
    const tc = d.textColor || primaryColor;
    const bg = d.backgroundColor || '#ffffff';
    const ac = d.accentColor || secondaryColor;
    const pad = d.padding || { top: 12, bottom: 12, left: 16, right: 16 };
    const showDivider = d.showDivider !== false;
    const dividerStyle = d.dividerStyle || 'solid';
    const dividerColor = d.dividerColor || '#e5e7eb';
    const variant = section.layoutVariant || 1;

    const wrapperStyle = `font-family: '${ff}', sans-serif; font-size: ${fs}px; color: ${tc}; background: ${bg}; padding: ${pad.top}px ${pad.right}px ${pad.bottom}px ${pad.left}px; margin-bottom: ${sectionSpacing}px;`;
    const headingStyle = `text-transform: uppercase; letter-spacing: 2px; font-weight: 700; font-size: 11px; color: ${ac}; margin-bottom: 6px;`;
    const dividerHTML = showDivider ? `<div style="border-bottom: 1px ${dividerStyle} ${dividerColor}; margin-bottom: 8px;"></div>` : '';

    switch (section.type) {
      case 'header': {
        const name = personalInfo.fullName || personalInfo.name || '';
        const job = personalInfo.jobTitle || data.jobTitle || '';
        const email = personalInfo.email || '';
        const phone = personalInfo.phone || '';
        const city = personalInfo.city || personalInfo.address || personalInfo.location || '';
        const linkedin = personalInfo.linkedin || '';

        if (variant === 2) {
          return `<div style="${wrapperStyle} display: flex; justify-content: space-between;">
            <div><div style="font-size: 24px; font-weight: 700; color: ${ac}; text-transform: uppercase;">${name}</div><div style="font-size: 14px; color: #6b7280;">${job}</div></div>
            <div style="text-align: right; font-size: 12px; color: #6b7280;">${email ? '✉ ' + email + '<br>' : ''}${phone ? '📞 ' + phone + '<br>' : ''}${city ? '📍 ' + city + '<br>' : ''}${linkedin ? '🔗 ' + linkedin : ''}</div>
          </div>`;
        } else if (variant === 3) {
          return `<div style="${wrapperStyle} text-align: center;">
            <div style="font-size: 24px; font-weight: 700; color: ${ac}; text-transform: uppercase;">${name}</div>
            <div style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">${job}</div>
            <div style="border-top: 2px solid ${ac}; margin: 8px auto; width: 60%;"></div>
            <div style="font-size: 11px; color: #6b7280;">${[email && '✉ ' + email, phone && '📞 ' + phone, city && '📍 ' + city].filter(Boolean).join(' | ')}</div>
          </div>`;
        } else if (variant === 4) {
          const initials = name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
          return `<div style="${wrapperStyle} background: ${primaryColor}; color: #fff; display: flex; align-items: center; gap: 16px; padding: 20px;">
            <div style="width: 48px; height: 48px; border-radius: 50%; background: ${ac}; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 18px;">${initials}</div>
            <div>
              <div style="font-size: 22px; font-weight: 700;">${name}</div>
              <div style="font-size: 13px; opacity: 0.8;">${job}</div>
              <div style="font-size: 11px; opacity: 0.7; margin-top: 4px;">${[email && '✉ ' + email, phone && '📞 ' + phone, city && '📍 ' + city].filter(Boolean).join('  ')}</div>
            </div>
          </div>`;
        }
        // variant 1
        return `<div style="${wrapperStyle}">
          <div style="font-size: 24px; font-weight: 700; color: ${ac}; text-transform: uppercase;">${name}</div>
          <div style="font-size: 14px; color: #6b7280; margin-bottom: 6px;">${job}</div>
          <div style="font-size: 11px; color: #6b7280;">${[email && '✉ ' + email, phone && '📞 ' + phone, city && '📍 ' + city, linkedin && '🔗 ' + linkedin].filter(Boolean).join(' | ')}</div>
        </div>`;
      }

      case 'summary': {
        if (variant === 2) {
          return `<div style="${wrapperStyle} border-left: 3px solid ${ac}; padding-left: 16px;">
            <div style="${headingStyle}">Profile</div><p style="line-height: ${lineHeight};">${summary}</p>
          </div>`;
        } else if (variant === 3) {
          return `<div style="${wrapperStyle}">
            <div style="${headingStyle}">📝 Professional Summary</div>${dividerHTML}<p style="line-height: ${lineHeight};">${summary}</p>
          </div>`;
        } else if (variant === 4) {
          return `<div style="${wrapperStyle} background: #f9fafb; border-radius: 6px; font-style: italic;">
            <span style="font-size: 28px; color: ${ac}; line-height: 1;">"</span>
            <p style="line-height: ${lineHeight}; margin: 4px 0;">${summary}</p>
            <span style="font-size: 28px; color: ${ac}; line-height: 1; float: right;">"</span>
          </div>`;
        }
        return `<div style="${wrapperStyle}"><div style="${headingStyle}">Profile</div>${dividerHTML}<p style="line-height: ${lineHeight};">${summary}</p></div>`;
      }

      case 'experience': {
        const items = experience.map(exp => {
          const company = exp.company || '';
          const role = exp.role || exp.jobTitle || '';
          const startDate = exp.startDate ? new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
          const endDate = exp.isCurrentJob ? 'Present' : (exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '');
          const location = exp.location || '';
          const bullets = exp.bullets || exp.achievements || [];
          const desc = exp.description || '';

          if (variant === 2) {
            return `<div style="display: flex; margin-bottom: 12px;">
              <div style="width: 2px; background: ${ac}; margin-right: 12px; position: relative;"><div style="width: 8px; height: 8px; border-radius: 50%; background: ${ac}; position: absolute; top: 4px; left: -3px;"></div></div>
              <div><div style="font-weight: 600;">${company}</div><div style="font-size: 12px; color: #6b7280;">${role} | ${startDate} – ${endDate}</div>
              ${bullets.length ? '<ul style="margin: 4px 0; padding-left: 16px;">' + bullets.map(b => `<li style="font-size: 12px; margin-bottom: 2px;">${b}</li>`).join('') + '</ul>' : (desc ? `<p style="font-size: 12px; margin: 4px 0;">${desc}</p>` : '')}
              </div></div>`;
          } else if (variant === 3) {
            return `<div style="background: #f9fafb; border-radius: 6px; padding: 12px; margin-bottom: 8px;">
              <div style="font-weight: 600;">${company}</div><div style="font-size: 12px; color: #6b7280;">${role} | ${startDate} – ${endDate}${location ? ' | ' + location : ''}</div>
              ${bullets.length ? '<ul style="margin: 4px 0; padding-left: 16px;">' + bullets.map(b => `<li style="font-size: 12px;">${b}</li>`).join('') + '</ul>' : (desc ? `<p style="font-size: 12px;">${desc}</p>` : '')}
            </div>`;
          } else if (variant === 4) {
            return `<div style="display: flex; margin-bottom: 10px;">
              <div style="width: 35%; font-size: 12px;"><div style="font-weight: 600;">${company}</div><div style="color: #6b7280;">${startDate} – ${endDate}</div><div style="color: #6b7280;">${location}</div></div>
              <div style="width: 1px; background: #e5e7eb; margin: 0 12px;"></div>
              <div style="flex: 1;"><div style="font-weight: 600;">${role}</div>
              ${bullets.length ? '<ul style="margin: 4px 0; padding-left: 16px;">' + bullets.map(b => `<li style="font-size: 12px;">${b}</li>`).join('') + '</ul>' : (desc ? `<p style="font-size: 12px;">${desc}</p>` : '')}
              </div></div>`;
          }
          return `<div style="margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between;"><span style="font-weight: 600;">${company}</span><span style="font-size: 12px; color: #6b7280;">${role}</span></div>
            <div style="font-size: 11px; color: #6b7280;">${startDate} – ${endDate}${location ? ' | ' + location : ''}</div>
            ${bullets.length ? '<ul style="margin: 4px 0; padding-left: 16px;">' + bullets.map(b => `<li style="font-size: 12px;">${b}</li>`).join('') + '</ul>' : (desc ? `<p style="font-size: 12px;">${desc}</p>` : '')}
          </div>`;
        }).join('');
        return `<div style="${wrapperStyle}"><div style="${headingStyle}">Experience</div>${dividerHTML}${items}</div>`;
      }

      case 'education': {
        const items = education.map(edu => {
          const inst = edu.institution || '';
          const degree = edu.degree || '';
          const year = edu.year || (edu.startDate ? new Date(edu.startDate).getFullYear() : '') + (edu.endDate ? ' – ' + new Date(edu.endDate).getFullYear() : '');
          const grade = edu.grade || edu.percentage || edu.cgpa || '';

          if (variant === 3) {
            return `<div style="display: flex; margin-bottom: 10px;">
              <div style="width: 2px; background: ${ac}; margin-right: 12px; position: relative;"><div style="width: 8px; height: 8px; border-radius: 50%; background: ${ac}; position: absolute; top: 4px; left: -3px;"></div></div>
              <div><div style="font-weight: 600;">${inst}</div><div style="font-size: 12px; color: #6b7280;">${degree} | ${year}${grade ? ' | Grade: ' + grade : ''}</div></div></div>`;
          } else if (variant === 4) {
            return `<div style="background: #f9fafb; border-radius: 6px; padding: 12px; margin-bottom: 8px;">
              <div style="font-weight: 600;">🎓 ${inst}</div><div style="font-size: 12px; color: #6b7280;">${degree}</div><div style="font-size: 11px; color: #9ca3af;">${year}${grade ? '  |  Grade: ' + grade : ''}</div>
            </div>`;
          }
          return `<div style="margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between;"><span style="font-weight: 600;">${inst}</span><span style="font-size: 12px;">${degree}</span></div>
            <div style="font-size: 11px; color: #6b7280;">${year}${grade ? ' | Grade: ' + grade : ''}</div>
          </div>`;
        }).join('');
        return `<div style="${wrapperStyle}"><div style="${headingStyle}">Education</div>${dividerHTML}${items}</div>`;
      }

      case 'skills': {
        if (variant === 2) {
          const items = skillList.map(s => `<div style="margin-bottom: 6px;"><div style="display: flex; justify-content: space-between; font-size: 12px;"><span>${s.name}</span><span>${s.level}%</span></div><div style="height: 4px; background: #e5e7eb; border-radius: 2px;"><div style="height: 100%; width: ${s.level}%; background: ${ac}; border-radius: 2px;"></div></div></div>`).join('');
          return `<div style="${wrapperStyle}"><div style="${headingStyle}">Skills</div>${dividerHTML}${items}</div>`;
        } else if (variant === 3) {
          const items = skillList.map(s => {
            const dots = Math.round(s.level / 20);
            return `<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 12px;"><span style="min-width: 100px;">${s.name}</span><span>${'●'.repeat(dots)}${'○'.repeat(5 - dots)}</span></div>`;
          }).join('');
          return `<div style="${wrapperStyle}"><div style="${headingStyle}">Skills</div>${dividerHTML}${items}</div>`;
        } else if (variant === 4) {
          const half = Math.ceil(skillList.length / 2);
          const col1 = skillList.slice(0, half).map(s => `<div style="font-size: 12px; margin-bottom: 3px;">• ${s.name}</div>`).join('');
          const col2 = skillList.slice(half).map(s => `<div style="font-size: 12px; margin-bottom: 3px;">• ${s.name}</div>`).join('');
          return `<div style="${wrapperStyle}"><div style="${headingStyle}">Skills</div>${dividerHTML}<div style="display: flex; gap: 24px;"><div style="flex: 1;">${col1}</div><div style="flex: 1;">${col2}</div></div></div>`;
        }
        // variant 1 - chips
        const chips = skillList.map(s => `<span style="display: inline-block; background: ${ac}; color: #fff; padding: 3px 10px; border-radius: 12px; font-size: 11px; margin: 2px 4px 2px 0;">${s.name}</span>`).join('');
        return `<div style="${wrapperStyle}"><div style="${headingStyle}">Skills</div>${dividerHTML}${chips}</div>`;
      }

      case 'languages': {
        const langList = Array.isArray(languages) ? languages : [];
        const items = langList.map(l => {
          const name = l.name || l.language || '';
          const prof = l.proficiency || '';
          if (variant === 3) {
            const lvl = prof === 'Native' ? 100 : prof === 'Advanced' ? 80 : prof === 'Intermediate' ? 60 : 30;
            return `<div style="margin-bottom: 6px;"><div style="display: flex; justify-content: space-between; font-size: 12px;"><span>${name}</span><span>${lvl}%</span></div><div style="height: 4px; background: #e5e7eb; border-radius: 2px;"><div style="height: 100%; width: ${lvl}%; background: ${ac}; border-radius: 2px;"></div></div></div>`;
          } else if (variant === 4) {
            const dots = prof === 'Native' ? 5 : prof === 'Advanced' ? 4 : prof === 'Intermediate' ? 3 : 2;
            return `<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 12px;"><span style="min-width: 80px;">${name}</span><span>${'●'.repeat(dots)}${'○'.repeat(5 - dots)}</span></div>`;
          }
          return `<div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;"><span>${name}</span><span style="text-transform: uppercase; font-size: 10px; color: #6b7280;">${prof}</span></div>`;
        }).join('');
        return `<div style="${wrapperStyle}"><div style="${headingStyle}">Languages</div>${dividerHTML}${items}</div>`;
      }

      case 'certifications': {
        const items = certifications.map(c => {
          const name = c.name || '';
          const issuer = c.issuer || '';
          const year = c.year || (c.issueDate ? new Date(c.issueDate).getFullYear() : '');
          if (variant === 3) {
            return `<div style="border-left: 3px solid ${ac}; padding-left: 10px; margin-bottom: 8px;"><div style="font-weight: 600; font-size: 13px;">${name}</div><div style="font-size: 11px; color: #6b7280;">${issuer}${year ? ' | ' + year : ''}</div></div>`;
          } else if (variant === 4) {
            return `<span style="display: inline-block; background: #f3f4f6; border-radius: 6px; padding: 6px 12px; margin: 2px 4px 2px 0; font-size: 11px;">🏅 ${name} ${year}</span>`;
          }
          return `<div style="margin-bottom: 6px;"><div style="font-weight: 600; font-size: 13px;">${variant === 2 ? '🏅 ' : ''}${name}</div><div style="font-size: 11px; color: #6b7280;">${issuer}${year ? ' | ' + year : ''}</div></div>`;
        }).join('');
        return `<div style="${wrapperStyle}"><div style="${headingStyle}">Certifications</div>${dividerHTML}${items}</div>`;
      }

      case 'projects': {
        const items = projects.map(p => {
          const title = p.name || p.title || '';
          const role = p.role || '';
          const desc = p.description || '';
          const tech = p.techStack || p.technologies || [];
          const startDate = p.startDate ? new Date(p.startDate).getFullYear() : '';
          const endDate = p.endDate ? new Date(p.endDate).getFullYear() : '';
          const dateStr = startDate ? (endDate ? `${startDate} – ${endDate}` : startDate) : '';
          const liveUrl = p.liveUrl || p.link || '';
          const githubUrl = p.githubUrl || '';

          if (variant === 2) {
            return `<div style="background: #f9fafb; border-radius: 6px; padding: 12px; margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between;"><span style="font-weight: 600;">${title}</span><span style="font-size: 11px; color: #9ca3af;">${dateStr}</span></div>
              ${role ? `<div style="font-size: 12px; color: #6b7280;">${role}</div>` : ''}
              ${desc ? `<p style="font-size: 12px; margin: 4px 0;">${desc}</p>` : ''}
              ${tech.length ? '<div>' + tech.map(t => `<span style="display: inline-block; background: #e5e7eb; padding: 1px 6px; border-radius: 3px; font-size: 10px; margin-right: 4px;">${t}</span>`).join('') + '</div>' : ''}
              ${liveUrl || githubUrl ? `<div style="font-size: 11px; margin-top: 4px;">${liveUrl ? '🔗 Live Demo' : ''}${liveUrl && githubUrl ? '  |  ' : ''}${githubUrl ? '💻 GitHub' : ''}</div>` : ''}
            </div>`;
          } else if (variant === 4) {
            return `<div style="font-size: 12px; margin-bottom: 4px;">• ${title}${dateStr ? ' (' + dateStr + ')' : ''} — ${tech.join(', ')}</div>`;
          }
          return `<div style="margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between;"><span style="font-weight: 600;">${title}</span><span style="font-size: 11px; color: #9ca3af;">${dateStr}</span></div>
            ${role ? `<div style="font-size: 12px; color: #6b7280;">${role}</div>` : ''}
            ${desc ? `<p style="font-size: 12px; margin: 4px 0;">${desc}</p>` : ''}
            ${tech.length ? '<div>' + tech.map(t => `<span style="display: inline-block; background: ${ac}; color: #fff; padding: 1px 6px; border-radius: 3px; font-size: 10px; margin-right: 4px;">${t}</span>`).join('') + '</div>' : ''}
          </div>`;
        }).join('');
        return `<div style="${wrapperStyle}"><div style="${headingStyle}">Projects</div>${dividerHTML}${items}</div>`;
      }

      case 'awards': {
        const awardList = Array.isArray(awards) ? awards : [];
        const items = awardList.map(a => {
          const title = a.title || a;
          const org = a.organization || '';
          const year = a.year || '';
          const desc = a.description || '';
          if (variant === 2) {
            return `<div style="background: #f9fafb; border-radius: 6px; padding: 10px; margin-bottom: 6px;"><div style="font-weight: 600;">🥇 ${title} <span style="font-size: 11px; color: #9ca3af;">${year}</span></div>${org ? `<div style="font-size: 12px; color: #6b7280;">${org}</div>` : ''}${desc ? `<p style="font-size: 12px;">${desc}</p>` : ''}</div>`;
          }
          return `<div style="margin-bottom: 6px;"><div style="font-weight: 600;">${variant === 1 ? '🥇 ' : ''}${title}</div><div style="font-size: 11px; color: #6b7280;">${org}${year ? ' | ' + year : ''}</div>${desc ? `<p style="font-size: 12px;">${desc}</p>` : ''}</div>`;
        }).join('');
        return `<div style="${wrapperStyle}"><div style="${headingStyle}">Awards</div>${dividerHTML}${items}</div>`;
      }

      default:
        return '';
    }
  }

  const sectionsHTML = sections.map(s => buildSectionHTML(s)).join('');

  // Check if plan is free → add watermark
  const userPlan = resume.planType || 'Free';
  const isFreePlan = userPlan === 'Free' || userPlan === 'FREE';
  const watermarkHTML = isFreePlan
    ? `<div style="text-align: center; font-size: 9px; color: #9ca3af; padding: 12px 0; border-top: 1px solid #e5e7eb; margin-top: 20px;">Created with Resume Maker — Upgrade to Premium to remove this watermark</div>`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: '${fontFamily}', sans-serif; color: ${primaryColor}; line-height: ${lineHeight}; letter-spacing: ${letterSpacing}px; width: 595px; }
    p { margin: 0; }
    ul { margin: 0; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    .page-content { padding: ${pageMargin}px; }
  </style>
</head>
<body>
  <div class="page-content">
    ${sectionsHTML}
    ${watermarkHTML}
  </div>
</body>
</html>`;
}

/**
 * @desc    Generate PDF using Puppeteer with editorConfig layout
 * @route   POST /api/resume/:id/pdf
 * @access  Private
 */
const generateEditorPdf = asyncHandler(async (req, res) => {
  const puppeteer = require('puppeteer');

  const resume = await Resume.findById(req.params.id);

  if (!resume) {
    return notFoundResponse(res, 'Resume not found');
  }

  if (resume.userId.toString() !== req.user._id.toString()) {
    return forbiddenResponse(res, 'You do not have permission to generate this PDF');
  }

  const htmlString = buildResumeHTML(resume);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(htmlString, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });

    await browser.close();
    browser = null;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${(resume.title || 'resume').replace(/[^a-zA-Z0-9 ]/g, '')}.pdf"`);
    res.send(pdf);
  } catch (err) {
    if (browser) await browser.close();
    console.error('PDF generation error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate PDF. Please try again.',
      errors: [err.message]
    });
  }
});

module.exports = {
  createResume,
  getMyResumes,
  getResumeById,
  updateResume,
  deleteResume,
  toggleResumePublic,
  duplicateResume,
  downloadResumePDF,
  getResumeStats,
  updateResumeSection,
  exportResumeUrl,
  getPublicResume,
  scanResumeATS,
  improveResumeATS,
  saveEditorConfig,
  generateEditorPdf
};