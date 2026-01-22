// backend/src/controllers/application.controller.js
const Application = require('../models/Application.model');
const Job = require('../models/Job.model');
const Resume = require('../models/Resume.model');
const asyncHandler = require('../utils/asyncHandler');
const { 
  successResponse, 
  createdResponse,
  notFoundResponse,
  forbiddenResponse,
  badRequestResponse 
} = require('../utils/apiResponse');

/**
 * @desc    Apply for a job
 * @route   POST /api/v1/applications/apply/:jobId
 * @access  Private
 */
const applyForJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { resumeId, coverLetter, expectedSalary, availableFrom, noticePeriod } = req.body;

  // Check if job exists and is active
  const job = await Job.findById(jobId);
  if (!job) {
    return notFoundResponse(res, 'Job not found');
  }

  if (job.status !== 'Active') {
    return badRequestResponse(res, 'This job is no longer accepting applications');
  }

  // Check if application deadline has passed
  if (job.isExpired()) {
    return badRequestResponse(res, 'Application deadline has passed');
  }

  // Check if user has already applied
  const existingApplication = await Application.findOne({
    jobId,
    applicantId: req.user._id
  });

  if (existingApplication) {
    return badRequestResponse(res, 'You have already applied for this job');
  }

  // Verify resume belongs to user
  const resume = await Resume.findOne({
    _id: resumeId,
    userId: req.user._id
  });

  if (!resume) {
    return notFoundResponse(res, 'Resume not found or does not belong to you');
  }

  // Create application
  const application = await Application.create({
    jobId,
    applicantId: req.user._id,
    resumeId,
    coverLetter,
    expectedSalary,
    availableFrom,
    noticePeriod
  });

  // Increment job applications count
  job.applicationsCount += 1;
  await job.save();

  // Populate application data
  await application.populate([
    { path: 'jobId', select: 'title company location' },
    { path: 'resumeId', select: 'title' }
  ]);

  return createdResponse(res, { application }, 'Application submitted successfully');
});

/**
 * @desc    Get all applications (for user)
 * @route   GET /api/v1/applications/my-applications
 * @access  Private
 */
const getMyApplications = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  const query = { applicantId: req.user._id };
  if (status) query.status = status;

  const skip = (page - 1) * limit;
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const applications = await Application.find(query)
    .populate('jobId', 'title company location salary jobType status')
    .populate('resumeId', 'title')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Application.countDocuments(query);

  return successResponse(res, {
    applications,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit)
    }
  }, 'Applications retrieved successfully');
});

/**
 * @desc    Get single application
 * @route   GET /api/v1/applications/:id
 * @access  Private
 */
const getApplicationById = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id)
    .populate('jobId')
    .populate('applicantId', 'fullName email phone')
    .populate('resumeId');

  if (!application) {
    return notFoundResponse(res, 'Application not found');
  }

  // Check if user can view this application
  const isApplicant = application.applicantId._id.toString() === req.user._id.toString();
  const isEmployer = application.jobId.postedBy.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isApplicant && !isEmployer && !isAdmin) {
    return forbiddenResponse(res, 'You do not have permission to view this application');
  }

  // Mark as viewed by employer
  if (isEmployer && !application.isViewed) {
    application.isViewed = true;
    application.viewedAt = Date.now();
    await application.save();
  }

  return successResponse(res, { application }, 'Application retrieved successfully');
});

/**
 * @desc    Get applications for a job (for employer)
 * @route   GET /api/v1/applications/job/:jobId
 * @access  Private (Employer - Job owner only)
 */
const getJobApplications = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { status, page = 1, limit = 10 } = req.query;

  // Check if job exists and user is the owner
  const job = await Job.findById(jobId);
  if (!job) {
    return notFoundResponse(res, 'Job not found');
  }

  if (job.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return forbiddenResponse(res, 'You do not have permission to view these applications');
  }

  // Build query
  const query = { jobId };
  if (status) query.status = status;

  const skip = (page - 1) * limit;

  const applications = await Application.find(query)
    .populate('applicantId', 'fullName email phone location')
    .populate('resumeId', 'title personalInfo skills experience education')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Application.countDocuments(query);

  return successResponse(res, {
    applications,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit)
    }
  }, 'Job applications retrieved successfully');
});

/**
 * @desc    Update application status (for employer)
 * @route   PATCH /api/v1/applications/:id/status
 * @access  Private (Employer only)
 */
const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;

  const application = await Application.findById(req.params.id)
    .populate('jobId');

  if (!application) {
    return notFoundResponse(res, 'Application not found');
  }

  // Check if user is the job owner
  if (application.jobId.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return forbiddenResponse(res, 'You do not have permission to update this application');
  }

  // Update status
  application.status = status;

  // Add to timeline
  application.timeline.push({
    status,
    note,
    updatedBy: req.user._id,
    timestamp: Date.now()
  });

  await application.save();

  return successResponse(
    res, 
    { application }, 
    `Application status updated to ${status}`
  );
});

/**
 * @desc    Withdraw application (for applicant)
 * @route   PATCH /api/v1/applications/:id/withdraw
 * @access  Private
 */
const withdrawApplication = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const application = await Application.findById(req.params.id);

  if (!application) {
    return notFoundResponse(res, 'Application not found');
  }

  // Check if user is the applicant
  if (application.applicantId.toString() !== req.user._id.toString()) {
    return forbiddenResponse(res, 'You do not have permission to withdraw this application');
  }

  // Check if application can be withdrawn
  if (!application.canWithdraw()) {
    return badRequestResponse(
      res, 
      'Application cannot be withdrawn at this stage'
    );
  }

  // Withdraw application
  await application.withdraw(reason);

  // Decrement job applications count
  await Job.findByIdAndUpdate(
    application.jobId,
    { $inc: { applicationsCount: -1 } }
  );

  return successResponse(res, { application }, 'Application withdrawn successfully');
});

/**
 * @desc    Schedule interview (for employer)
 * @route   PATCH /api/v1/applications/:id/schedule-interview
 * @access  Private (Employer only)
 */
const scheduleInterview = asyncHandler(async (req, res) => {
  const { scheduledDate, mode, location, meetingLink, notes } = req.body;

  const application = await Application.findById(req.params.id)
    .populate('jobId');

  if (!application) {
    return notFoundResponse(res, 'Application not found');
  }

  // Check if user is the job owner
  if (application.jobId.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return forbiddenResponse(res, 'You do not have permission to schedule interview');
  }

  // Update interview details
  application.interview = {
    scheduledDate,
    mode,
    location,
    meetingLink,
    notes
  };

  application.status = 'Interview Scheduled';

  await application.save();

  // TODO: Send email notification to applicant

  return successResponse(res, { application }, 'Interview scheduled successfully');
});

/**
 * @desc    Add employer feedback (for employer)
 * @route   PATCH /api/v1/applications/:id/feedback
 * @access  Private (Employer only)
 */
const addEmployerFeedback = asyncHandler(async (req, res) => {
  const { rating, comments, strengths, improvements } = req.body;

  const application = await Application.findById(req.params.id)
    .populate('jobId');

  if (!application) {
    return notFoundResponse(res, 'Application not found');
  }

  // Check if user is the job owner
  if (application.jobId.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return forbiddenResponse(res, 'You do not have permission to add feedback');
  }

  // Add feedback
  application.employerFeedback = {
    rating,
    comments,
    strengths,
    improvements
  };

  await application.save();

  return successResponse(res, { application }, 'Feedback added successfully');
});

/**
 * @desc    Toggle star/bookmark application (for employer)
 * @route   PATCH /api/v1/applications/:id/toggle-star
 * @access  Private (Employer only)
 */
const toggleStarApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id)
    .populate('jobId');

  if (!application) {
    return notFoundResponse(res, 'Application not found');
  }

  // Check if user is the job owner
  if (application.jobId.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return forbiddenResponse(res, 'You do not have permission to star this application');
  }

  application.isStarred = !application.isStarred;
  await application.save();

  return successResponse(
    res, 
    { application, isStarred: application.isStarred }, 
    `Application ${application.isStarred ? 'starred' : 'unstarred'}`
  );
});

/**
 * @desc    Get application statistics for user
 * @route   GET /api/v1/applications/statistics
 * @access  Private
 */
const getApplicationStatistics = asyncHandler(async (req, res) => {
  const stats = await Application.aggregate([
    { $match: { applicantId: req.user._id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const formattedStats = {
    total: 0,
    byStatus: {}
  };

  stats.forEach(stat => {
    formattedStats.total += stat.count;
    formattedStats.byStatus[stat._id] = stat.count;
  });

  return successResponse(
    res, 
    formattedStats, 
    'Application statistics retrieved successfully'
  );
});

module.exports = {
  applyForJob,
  getMyApplications,
  getApplicationById,
  getJobApplications,
  updateApplicationStatus,
  withdrawApplication,
  scheduleInterview,
  addEmployerFeedback,
  toggleStarApplication,
  getApplicationStatistics
};