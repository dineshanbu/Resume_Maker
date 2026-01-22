// backend/src/models/Job.model.js
const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Basic Job Information
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
    index: true
  },
  company: {
    name: { type: String, required: true },
    logo: String,
    website: String,
    description: String,
    size: { 
      type: String, 
      enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'] 
    }
  },
  
  // Job Details
  description: {
    type: String,
    required: [true, 'Job description is required'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  responsibilities: [String],
  requirements: [String],
  
  // Job Classification
  category: {
    type: String,
    required: true,
    enum: [
      'IT & Software',
      'Sales & Marketing',
      'Finance & Accounting',
      'Human Resources',
      'Engineering',
      'Healthcare',
      'Education',
      'Customer Service',
      'Operations',
      'Design & Creative',
      'Other'
    ],
    index: true
  },
  
  jobType: {
    type: String,
    required: true,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'],
    index: true
  },
  
  workMode: {
    type: String,
    required: true,
    enum: ['On-site', 'Remote', 'Hybrid'],
    default: 'On-site'
  },
  
  // Location
  location: {
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, default: 'India' },
    pincode: String,
    address: String
  },
  
  // Salary Information
  salary: {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    period: { 
      type: String, 
      enum: ['Hourly', 'Monthly', 'Yearly'], 
      default: 'Yearly' 
    },
    isNegotiable: { type: Boolean, default: false }
  },
  
  // Experience & Education
  experience: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 20 },
    unit: { type: String, default: 'years' }
  },
  
  education: {
    minQualification: {
      type: String,
      enum: [
        'High School',
        'Diploma',
        'Bachelor',
        'Master',
        'PhD',
        'Any'
      ],
      default: 'Any'
    },
    preferredFields: [String]
  },
  
  // Skills Required
  skills: {
    required: [String],
    preferred: [String]
  },
  
  // Application Details
  applicationDeadline: {
    type: Date,
    required: true,
    validate: {
      validator: function(v) {
        return v > Date.now();
      },
      message: 'Application deadline must be in the future'
    }
  },
  
  vacancies: {
    type: Number,
    default: 1,
    min: [1, 'At least 1 vacancy required']
  },
  
  // Contact Information
  contactEmail: {
    type: String,
    required: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
  },
  
  contactPhone: String,
  
  // Job Status
  status: {
    type: String,
    enum: ['Draft', 'Active', 'Closed', 'On Hold'],
    default: 'Active',
    index: true
  },
  
  // Additional Info
  benefits: [String],
  applicationInstructions: String,
  
  // Analytics
  views: {
    type: Number,
    default: 0
  },
  loggedInViews: {
    type: Number,
    default: 0
  },
  guestViews: {
    type: Number,
    default: 0
  },
  
  applicationsCount: {
    type: Number,
    default: 0
  },
  
  // Featured/Premium
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  featuredUntil: Date,
  
  // SEO
  tags: [String],
  slug: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

// Indexes for search and filtering
jobSchema.index({ title: 'text', description: 'text', 'company.name': 'text' });
jobSchema.index({ category: 1, jobType: 1 });
jobSchema.index({ 'location.city': 1, 'location.state': 1 });
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ applicationDeadline: 1 });
jobSchema.index({ postedBy: 1, status: 1 });

// Generate slug from title
jobSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim() + '-' + Date.now();
  }
  next();
});

// Check if job is expired
jobSchema.methods.isExpired = function() {
  return this.applicationDeadline < new Date();
};

// Auto-close expired jobs (can be run via cron job)
jobSchema.statics.closeExpiredJobs = async function() {
  const result = await this.updateMany(
    {
      status: 'Active',
      applicationDeadline: { $lt: new Date() }
    },
    {
      $set: { status: 'Closed' }
    }
  );
  return result;
};

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;