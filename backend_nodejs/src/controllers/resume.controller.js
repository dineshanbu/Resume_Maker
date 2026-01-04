// backend/src/controllers/resume.controller.js
const Resume = require('../models/Resume.model');
const asyncHandler = require('../utils/asyncHandler');
const { 
  successResponse, 
  createdResponse,
  notFoundResponse,
  forbiddenResponse 
} = require('../utils/apiResponse');

/**
 * @desc    Create new resume
 * @route   POST /api/v1/resumes
 * @access  Private
 */
const createResume = asyncHandler(async (req, res) => {
  const resumeData = {
    ...req.body,
    userId: req.user._id
  };

  const resume = await Resume.create(resumeData);

  return createdResponse(res, { resume }, 'Resume created successfully');
});

/**
 * @desc    Get all resumes of logged-in user
 * @route   GET /api/v1/resumes
 * @access  Private
 */
const getMyResumes = asyncHandler(async (req, res) => {
  const resumes = await Resume.find({ userId: req.user._id })
    .sort({ createdAt: -1 });

  return successResponse(
    res, 
    { resumes, count: resumes.length }, 
    'Resumes retrieved successfully'
  );
});

/**
 * @desc    Get single resume by ID
 * @route   GET /api/v1/resumes/:id
 * @access  Private/Public (if resume is public)
 */
const getResumeById = asyncHandler(async (req, res) => {
  const resume = await Resume.findById(req.params.id)
    .populate('userId', 'fullName email');

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

  // Update resume
  resume = await Resume.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

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

  // Create duplicate
  const resumeData = originalResume.toObject();
  delete resumeData._id;
  delete resumeData.createdAt;
  delete resumeData.updatedAt;
  delete resumeData.views;
  delete resumeData.downloads;
  delete resumeData.pdfUrl;
  
  resumeData.title = `${originalResume.title} (Copy)`;
  resumeData.isPublic = false;

  const duplicatedResume = await Resume.create(resumeData);

  return createdResponse(res, { resume: duplicatedResume }, 'Resume duplicated successfully');
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
  updateResumeSection
};