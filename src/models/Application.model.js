// backend/src/models/Application.model.js
const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  applicantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true
  },

  // Application Status
  status: {
    type: String,
    enum: [
      'Applied',
      'Under Review',
      'Shortlisted',
      'Interview Scheduled',
      'Interviewed',
      'Offered',
      'Accepted',
      'Rejected',
      'Withdrawn'
    ],
    default: 'Applied'
  },

  // Cover Letter
  coverLetter: {
    type: String,
    maxlength: [2000, 'Cover letter cannot exceed 2000 characters']
  },

  // Additional Documents
  documents: [{
    name: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],

  // Application Answers (if job has screening questions)
  screeningAnswers: [{
    question: String,
    answer: String
  }],

  // Salary Expectations
  expectedSalary: {
    amount: Number,
    currency: { type: String, default: 'INR' },
    period: { type: String, enum: ['Monthly', 'Yearly'], default: 'Yearly' }
  },

  // Availability
  availableFrom: Date,
  noticePeriod: {
    value: Number,
    unit: { type: String, enum: ['Days', 'Weeks', 'Months'], default: 'Days' }
  },

  // Timeline Tracking
  timeline: [{
    status: String,
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: { type: Date, default: Date.now }
  }],

  // Interview Details (if scheduled)
  interview: {
    scheduledDate: Date,
    mode: { type: String, enum: ['In-person', 'Video', 'Phone'] },
    location: String,
    meetingLink: String,
    notes: String
  },

  // Feedback from Employer
  employerFeedback: {
    rating: { type: Number, min: 1, max: 5 },
    comments: String,
    strengths: [String],
    improvements: [String]
  },

  // Application Source
  source: {
    type: String,
    enum: ['Direct', 'Email', 'Referral', 'Job Board'],
    default: 'Direct'
  },

  referralCode: String,

  // Flags
  isViewed: {
    type: Boolean,
    default: false
  },

  viewedAt: Date,

  isStarred: {
    type: Boolean,
    default: false
  },

  // Withdrawal
  withdrawnAt: Date,
  withdrawalReason: String

}, {
  timestamps: true
});

// Compound indexes
applicationSchema.index({ jobId: 1, applicantId: 1 }, { unique: true }); // Prevent duplicate applications
applicationSchema.index({ applicantId: 1, status: 1, createdAt: -1 });
applicationSchema.index({ jobId: 1, status: 1, createdAt: -1 });

// Update timeline when status changes
applicationSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.timeline.push({
      status: this.status,
      timestamp: Date.now()
    });
  }
  next();
});

// Static method to get application statistics
applicationSchema.statics.getStatsByJob = async function (jobId) {
  return await this.aggregate([
    { $match: { jobId: mongoose.Types.ObjectId(jobId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

// Static method to get user's application history
applicationSchema.statics.getUserApplications = async function (userId, status = null) {
  const query = { applicantId: userId };
  if (status) query.status = status;

  return await this.find(query)
    .populate('jobId', 'title company location salary jobType')
    .sort({ createdAt: -1 });
};

// Method to check if application can be withdrawn
applicationSchema.methods.canWithdraw = function () {
  const nonWithdrawableStatuses = ['Offered', 'Accepted', 'Rejected', 'Withdrawn'];
  return !nonWithdrawableStatuses.includes(this.status);
};

// Method to withdraw application
applicationSchema.methods.withdraw = async function (reason) {
  if (!this.canWithdraw()) {
    throw new Error('Application cannot be withdrawn at this stage');
  }

  this.status = 'Withdrawn';
  this.withdrawnAt = Date.now();
  this.withdrawalReason = reason;

  return await this.save();
};

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;