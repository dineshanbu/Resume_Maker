// backend/src/controllers/job.controller.js
const Job = require('../models/Job.model');
const Application = require('../models/Application.model');
const asyncHandler = require('../utils/asyncHandler');
const { 
  successResponse, 
  createdResponse,
  notFoundResponse,
  forbiddenResponse,
  badRequestResponse 
} = require('../utils/apiResponse');

/**
 * @desc    Create new job posting
 * @route   POST /api/v1/jobs
 * @access  Private (Employer only)
 */
const createJob = asyncHandler(async (req, res) => {
  const jobData = {
    ...req.body,
    postedBy: req.user._id
  };

  const job = await Job.create(jobData);

  return createdResponse(res, { job }, 'Job posted successfully');
});

/**
 * @desc    Get all jobs with filters
 * @route   GET /api/v1/jobs
 * @access  Public
 */
const getAllJobs = asyncHandler(async (req, res) => {
  const {
    search,
    category,
    jobType,
    workMode,
    city,
    state,
    minSalary,
    maxSalary,
    experience,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build query
  const query = { status: 'Active' };

  // Text search
  if (search) {
    query.$text = { $search: search };
  }

  // Category filter
  if (category) {
    query.category = category;
  }

  // Job type filter
  if (jobType) {
    query.jobType = jobType;
  }

  // Work mode filter
  if (workMode) {
    query.workMode = workMode;
  }

  // Location filters
  if (city) {
    query['location.city'] = new RegExp(city, 'i');
  }
  if (state) {
    query['location.state'] = new RegExp(state, 'i');
  }

  // Salary range filter
  if (minSalary) {
    query['salary.min'] = { $gte: parseInt(minSalary) };
  }
  if (maxSalary) {
    query['salary.max'] = { $lte: parseInt(maxSalary) };
  }

  // Experience filter
  if (experience) {
    const exp = parseInt(experience);
    query['experience.min'] = { $lte: exp };
    query['experience.max'] = { $gte: exp };
  }

  // Pagination
  const skip = (page - 1) * limit;

  // Sort
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Execute query
  const jobs = await Job.find(query)
    .populate('postedBy', 'fullName email')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Job.countDocuments(query);

  return successResponse(res, {
    jobs,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit)
    }
  }, 'Jobs retrieved successfully');
});

/**
 * @desc    Get single job by ID
 * @route   GET /api/v1/jobs/:id
 * @access  Public
 */
const getJobById = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id)
    .populate('postedBy', 'fullName email company');

  if (!job) {
    return notFoundResponse(res, 'Job not found');
  }

  // Increment view count
  job.views += 1;
  await job.save();

  // Check if user has applied (if authenticated)
  let hasApplied = false;
  if (req.user) {
    const application = await Application.findOne({
      jobId: job._id,
      applicantId: req.user._id
    });
    hasApplied = !!application;
  }

  return successResponse(
    res, 
    { job, hasApplied }, 
    'Job retrieved successfully'
  );
});

/**
 * @desc    Update job
 * @route   PUT /api/v1/jobs/:id
 * @access  Private (Employer - Owner only)
 */
const updateJob = asyncHandler(async (req, res) => {
  let job = await Job.findById(req.params.id);

  if (!job) {
    return notFoundResponse(res, 'Job not found');
  }

  // Check ownership
  if (job.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return forbiddenResponse(res, 'You do not have permission to update this job');
  }

  job = await Job.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  return successResponse(res, { job }, 'Job updated successfully');
});

/**
 * @desc    Delete job
 * @route   DELETE /api/v1/jobs/:id
 * @access  Private (Employer - Owner only)
 */
const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    return notFoundResponse(res, 'Job not found');
  }

  // Check ownership
  if (job.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return forbiddenResponse(res, 'You do not have permission to delete this job');
  }

  await job.deleteOne();

  return successResponse(res, null, 'Job deleted successfully');
});

/**
 * @desc    Change job status
 * @route   PATCH /api/v1/jobs/:id/status
 * @access  Private (Employer - Owner only)
 */
const changeJobStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  const job = await Job.findById(req.params.id);

  if (!job) {
    return notFoundResponse(res, 'Job not found');
  }

  // Check ownership
  if (job.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return forbiddenResponse(res, 'You do not have permission to modify this job');
  }

  job.status = status;
  await job.save();

  return successResponse(res, { job }, `Job status changed to ${status}`);
});

/**
 * @desc    Get jobs posted by employer
 * @route   GET /api/v1/jobs/employer/my-jobs
 * @access  Private (Employer only)
 */
const getMyJobs = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  const query = { postedBy: req.user._id };
  if (status) query.status = status;

  const skip = (page - 1) * limit;

  const jobs = await Job.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Job.countDocuments(query);

  return successResponse(res, {
    jobs,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit)
    }
  }, 'Your jobs retrieved successfully');
});

/**
 * @desc    Get job statistics for employer
 * @route   GET /api/v1/jobs/:id/statistics
 * @access  Private (Employer - Owner only)
 */
const getJobStatistics = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    return notFoundResponse(res, 'Job not found');
  }

  // Check ownership
  if (job.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return forbiddenResponse(res, 'You do not have permission to view these statistics');
  }

  // Get application statistics
  const applicationStats = await Application.aggregate([
    { $match: { jobId: job._id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const stats = {
    views: job.views,
    totalApplications: job.applicationsCount,
    applicationsByStatus: applicationStats,
    daysActive: Math.floor((Date.now() - job.createdAt) / (1000 * 60 * 60 * 24)),
    daysRemaining: Math.floor((job.applicationDeadline - Date.now()) / (1000 * 60 * 60 * 24))
  };

  return successResponse(res, stats, 'Job statistics retrieved successfully');
});

/**
 * @desc    Get recommended jobs for user
 * @route   GET /api/v1/jobs/recommendations
 * @access  Private
 */
const getRecommendedJobs = asyncHandler(async (req, res) => {
  const user = req.user;
  const { limit = 10 } = req.query;

  // Build query based on user preferences
  const query = { status: 'Active' };

  if (user.preferences?.jobCategories?.length > 0) {
    query.category = { $in: user.preferences.jobCategories };
  }

  if (user.preferences?.jobTypes?.length > 0) {
    query.jobType = { $in: user.preferences.jobTypes };
  }

  if (user.location?.city) {
    query['location.city'] = user.location.city;
  }

  // Get recommended jobs
  const jobs = await Job.find(query)
    .populate('postedBy', 'fullName email')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  return successResponse(
    res, 
    { jobs, count: jobs.length }, 
    'Recommended jobs retrieved successfully'
  );
});

/**
 * @desc    Search jobs by location
 * @route   GET /api/v1/jobs/search/location
 * @access  Public
 */
const searchJobsByLocation = asyncHandler(async (req, res) => {
  const { lat, lng, radius = 50 } = req.query; // radius in km

  if (!lat || !lng) {
    return badRequestResponse(res, 'Latitude and longitude are required');
  }

  // TODO: Implement geospatial search
  // For now, return all active jobs
  const jobs = await Job.find({ status: 'Active' })
    .limit(20);

  return successResponse(
    res, 
    { jobs, count: jobs.length }, 
    'Jobs retrieved successfully'
  );
});

/**
 * @desc    Get featured jobs
 * @route   GET /api/v1/jobs/featured
 * @access  Public
 */
const getFeaturedJobs = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const jobs = await Job.find({
    status: 'Active',
    isFeatured: true,
    featuredUntil: { $gt: Date.now() }
  })
    .populate('postedBy', 'fullName email')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  return successResponse(
    res, 
    { jobs, count: jobs.length }, 
    'Featured jobs retrieved successfully'
  );
});

module.exports = {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  changeJobStatus,
  getMyJobs,
  getJobStatistics,
  getRecommendedJobs,
  searchJobsByLocation,
  getFeaturedJobs
};