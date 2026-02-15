// backend/src/models/Resume.model.js
const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Resume title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template',
    required: true,
    index: true
  },
  
  // Resume data as JSON (for flexible storage)
  resumeData: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  
  // Resume status
  status: {
    type: String,
    enum: ['Draft', 'Completed'],
    default: 'Draft',
    index: true
  },
  
  // Completion percentage (0-100)
  completionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Personal Information (optional - data stored in resumeData for flexibility)
  personalInfo: {
    fullName: { type: String, required: false },
    email: { type: String, required: false },
    phone: { type: String, required: false },
    address: String,
    city: String,
    state: String,
    pincode: String,
    linkedin: String,
    portfolio: String,
    github: String,
    profileImage: String
  },

  // Professional Summary
  summary: {
    type: String,
    maxlength: [1000, 'Summary cannot exceed 1000 characters']
  },

  // Work Experience
  experience: [{
    jobTitle: { type: String, required: true },
    company: { type: String, required: true },
    location: String,
    startDate: { type: Date, required: true },
    endDate: Date,
    isCurrentJob: { type: Boolean, default: false },
    description: String,
    achievements: [String]
  }],

  // Education
  education: [{
    degree: { type: String, required: true },
    institution: { type: String, required: true },
    location: String,
    startDate: { type: Date, required: true },
    endDate: Date,
    isCurrentlyStudying: { type: Boolean, default: false },
    percentage: Number,
    cgpa: Number,
    description: String
  }],

  // Skills
  skills: {
    technical: [String],
    soft: [String],
    languages: [{
      language: String,
      proficiency: { 
        type: String, 
        enum: ['Beginner', 'Intermediate', 'Advanced', 'Native'] 
      }
    }]
  },

  // Projects
  projects: [{
    title: { type: String, required: true },
    description: String,
    technologies: [String],
    link: String,
    startDate: Date,
    endDate: Date,
    highlights: [String]
  }],

  // Certifications
  certifications: [{
    name: { type: String, required: true },
    issuer: String,
    issueDate: Date,
    expiryDate: Date,
    credentialId: String,
    credentialUrl: String
  }],

  // Additional Sections
  achievements: [String],
  interests: [String],
  references: [{
    name: String,
    position: String,
    company: String,
    email: String,
    phone: String
  }],

  // ATS Analysis History (optional)
  // Stores historical ATS scan results so we can show improvements over time
  atsHistory: [{
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    keywordMatch: {
      type: Number,
      min: 0,
      max: 100
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Resume Metadata
  isPublic: {
    type: Boolean,
    default: false
  },
  pdfUrl: String,
  views: {
    type: Number,
    default: 0
  },
  downloads: {
    type: Number,
    default: 0
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  
  // Plan and URL Export Fields
  planType: {
    type: String,
    enum: ['Free', 'Premium', 'FREE', 'PRO'],
    default: 'Free',
    index: true
  },
  publicUrl: {
    type: String,
    sparse: true,
    unique: true,
    default: undefined // Don't set default to null - let it be undefined for sparse index to work correctly
  },
  publicUrlToken: {
    type: String,
    sparse: true,
    unique: true,
    index: true,
    default: undefined // Don't set default to null - let it be undefined for sparse index to work correctly
  },
  urlExpiresAt: {
    type: Date,
    default: null,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
resumeSchema.index({ userId: 1, createdAt: -1 });
resumeSchema.index({ userId: 1, status: 1 });
resumeSchema.index({ templateId: 1 });
resumeSchema.index({ 'personalInfo.email': 1 });
resumeSchema.index({ isPublic: 1 });
resumeSchema.index({ publicUrlToken: 1 });
resumeSchema.index({ urlExpiresAt: 1 });

// Update lastModified on save
resumeSchema.pre('save', function(next) {
  this.lastModified = Date.now();
  next();
});

// Virtual for years of experience
resumeSchema.virtual('totalExperience').get(function() {
  if (!this.experience || this.experience.length === 0) return 0;
  
  let totalMonths = 0;
  this.experience.forEach(exp => {
    const start = new Date(exp.startDate);
    const end = exp.isCurrentJob ? new Date() : new Date(exp.endDate);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                   (end.getMonth() - start.getMonth());
    totalMonths += months;
  });
  
  return (totalMonths / 12).toFixed(1);
});

// Ensure virtuals are included in JSON
resumeSchema.set('toJSON', { virtuals: true });
resumeSchema.set('toObject', { virtuals: true });

const Resume = mongoose.model('Resume', resumeSchema);

module.exports = Resume;