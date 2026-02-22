// backend/src/models/User.model.js (UPDATED with Google OAuth)
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [3, 'Name must be at least 3 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password by default
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  role: {
    type: String,
    enum: ['user', 'employer', 'admin'],
    default: 'user'
  },
  profilePicture: {
    type: String,
    default: null
  },
  location: {
    city: String,
    state: String,
    country: { type: String, default: 'India' }
  },

  // OAuth Integration - Support multiple providers (array)
  authProvider: {
    type: [String],
    enum: ['local', 'google', 'linkedin'],
    default: ['local']
  },

  googleId: {
    type: String,
    sparse: true,
    unique: true
  },

  linkedinId: {
    type: String,
    sparse: true,
    unique: true
  },

  // Email verification
  isVerified: {
    type: Boolean,
    default: false
  },

  emailVerificationToken: String,
  emailVerificationExpires: Date,

  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },

  // User preferences
  preferences: {
    jobCategories: [String],
    jobTypes: [String], // Full-time, Part-time, Contract
    expectedSalary: {
      min: Number,
      max: Number,
      currency: { type: String, default: 'INR' }
    },
    receiveEmailAlerts: { type: Boolean, default: true },
    preferredLanguage: { type: String, default: 'en' },
    theme: { type: String, enum: ['light', 'dark'], default: 'light' }
  },

  // Subscription info (reference)
  currentPlan: {
    type: String,
    enum: ['Free', 'Basic', 'Premium', 'FREE', 'PRO'],
    default: 'Free'
  },

  // Plan details (reference to Plan model)
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    default: null
  },
  subscriptionPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    default: null
  },
  planName: {
    type: String,
    enum: ['FREE', 'PRO', 'PREMIUM'],
    default: 'FREE'
  },
  subscriptionType: {
    type: String,
    enum: ['FREE', 'PREMIUM'],
    default: 'FREE'
  },
  subscriptionStatus: {
    type: String,
    enum: ['ACTIVE', 'EXPIRED', 'free', 'premium'],
    default: 'free'
  },
  resumesCreated: {
    type: Number,
    default: 0
  },
  planStartDate: {
    type: Date,
    default: Date.now
  },
  subscriptionStartDate: {
    type: Date,
    default: Date.now
  },
  planExpiryDate: {
    type: Date,
    default: null // NULL for FREE plan
  },
  subscriptionEndDate: {
    type: Date,
    default: null
  },

  // Razorpay Integration
  razorpayCustomerId: String,
  razorpayOrderId: String,
  razorpayPaymentId: String,

  // Reset password
  resetPasswordToken: String,
  resetPasswordExpires: Date,

  // Referral
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // ==================== USER PROFILE FIELDS ====================

  // Basic Info
  dateOfBirth: {
    type: Date,
    default: null
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    default: null
  },
  maritalStatus: {
    type: String,
    enum: ['Single', 'Married'],
    default: null
  },

  // Professional Summary
  headline: {
    type: String,
    trim: true,
    maxlength: [100, 'Headline cannot exceed 100 characters']
  },
  aboutMe: {
    type: String,
    trim: true,
    maxlength: [500, 'About me cannot exceed 500 characters']
  },

  // Employment Preferences
  currentRole: {
    type: String,
    trim: true
  },
  experienceYears: {
    type: Number,
    default: 0,
    min: [0, 'Experience years cannot be negative']
  },
  experienceMonths: {
    type: Number,
    default: 0,
    min: [0, 'Experience months cannot be negative'],
    max: [11, 'Experience months cannot exceed 11']
  },
  employmentType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'],
    default: null
  },
  jobType: {
    type: String,
    enum: ['Hybrid', 'Work from Home', 'Work from Office'],
    default: null
  },
  noticePeriod: {
    type: String,
    enum: ['Immediate', '1 Week', '2 Weeks', '1 Month', '2 Months', '3 Months'],
    default: null
  },
  preferredLocations: [{
    type: String,
    trim: true
  }],

  // Skills
  primarySkills: [{
    type: String,
    trim: true
  }],
  secondarySkills: [{
    type: String,
    trim: true
  }],

  // Language
  language: {
    type: String,
    trim: true,
    default: null
  },

  // Education (Array)
  education: [{
    degree: {
      type: String,
      trim: true,
      required: true
    },
    institution: {
      type: String,
      trim: true,
      required: true
    },
    passingYear: {
      type: Number,
      required: true,
      min: [1900, 'Passing year must be valid'],
      max: [new Date().getFullYear() + 5, 'Passing year cannot be in the future']
    },
    grade: {
      type: String,
      trim: true,
      required: true
    }
  }],

  // Online Profiles
  linkedInUrl: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+\..+/, 'Please provide a valid LinkedIn URL']
  },
  githubUrl: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+\..+/, 'Please provide a valid GitHub URL']
  },
  portfolioUrl: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+\..+/, 'Please provide a valid portfolio URL']
  },

  // Documents (removed resumePdf, keeping certifications for future use)
  certifications: [{
    type: String, // Cloudinary URLs
    trim: true
  }],

  // Profile Completion Percentage
  profileCompletionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }

  // NOTE: Template usage tracking has been moved to UserTemplateUsage collection
  // The array-based approach (freeTemplateIdsUsed) was logically flawed:
  // - MongoDB $expr + $size + $addToSet does NOT enforce hard limits reliably
  // - $or conditions can bypass array-length constraints
  // - UserTemplateUsage collection with unique index provides mathematically correct enforcement

}, {
  timestamps: true
});

// Index for faster queries
userSchema.index({ role: 1 });

// Hash password before saving (only for local auth)
userSchema.pre('save', async function (next) {
  // Only hash password if it's modified and user is using local auth
  const hasLocalAuth = Array.isArray(this.authProvider)
    ? this.authProvider.includes('local')
    : this.authProvider === 'local';

  if (!this.isModified('password') || !hasLocalAuth) {
    return next();
  }

  // Password is required for local auth
  if (!this.password && hasLocalAuth) {
    return next(new Error('Password is required for local authentication'));
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Generate referral code before saving
userSchema.pre('save', function (next) {
  if (!this.referralCode) {
    this.referralCode = this._id.toString().substring(0, 8).toUpperCase();
  }
  next();
});

// Method to compare password (for local auth)
userSchema.methods.comparePassword = async function (candidatePassword) {
  const hasLocalAuth = Array.isArray(this.authProvider)
    ? this.authProvider.includes('local')
    : this.authProvider === 'local';

  if (!hasLocalAuth) {
    throw new Error('Password comparison not available for OAuth-only users');
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile
userSchema.methods.getPublicProfile = function () {
  const user = this.toObject();
  delete user.password;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpires;
  delete user.emailVerificationToken;
  delete user.emailVerificationExpires;
  delete user.__v;
  return user;
};

// Static method to find or create user from Google OAuth
userSchema.statics.findOrCreateFromGoogle = async function (profile) {
  let user = await this.findOne({ googleId: profile.id });

  if (!user) {
    // Check if email already exists with local auth
    user = await this.findOne({ email: profile.emails[0].value });

    if (user) {
      // Update existing user with Google ID
      user.googleId = profile.id;
      user.authProvider = 'google';
      user.isVerified = true;
      if (!user.profilePicture && profile.photos && profile.photos.length > 0) {
        user.profilePicture = profile.photos[0].value;
      }
      await user.save();
    } else {
      // Create new user
      user = await this.create({
        fullName: profile.displayName,
        email: profile.emails[0].value,
        googleId: profile.id,
        authProvider: 'google',
        profilePicture: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null,
        isVerified: true
      });
    }
  }

  return user;
};

// Check if user can access feature based on subscription
userSchema.methods.canAccessFeature = async function (featureName) {
  try {
    const UserSubscription = mongoose.model('UserSubscription');
    const subscription = await UserSubscription.findOne({ userId: this._id });

    if (!subscription || !subscription.isActive()) {
      // Free plan limitations
      return false;
    }

    return await subscription.hasFeature(featureName);
  } catch (error) {
    // If UserSubscription model doesn't exist yet or other error, fallback to free
    return false;
  }
};

/**
 * Calculate profile completion percentage
 * Based on required sections with weights (updated):
 * - Personal Details: 25% (includes basic info + location + marital status)
 * - Professional Summary: 15%
 * - Employment Preferences: 20%
 * - Skills: 20%
 * - Education: 15%
 * - Language: 5%
 */
userSchema.methods.calculateProfileCompletion = function () {
  let completion = 0;

  // Personal Details (25%) - All required fields must be filled (name, email, phone, DOB, gender, marital status, country, state, city)
  const personalDetailsComplete =
    this.fullName &&
    this.email &&
    this.phone &&
    this.dateOfBirth &&
    this.gender &&
    this.maritalStatus &&
    this.location?.country &&
    this.location?.state &&
    this.location?.city;
  if (personalDetailsComplete) completion += 25;

  // Professional Summary (15%) - All required fields must be filled
  const professionalSummaryComplete =
    this.headline &&
    this.aboutMe;
  if (professionalSummaryComplete) completion += 15;

  // Employment Preferences (20%) - Required fields
  const employmentPreferencesComplete =
    this.currentRole &&
    this.employmentType &&
    this.jobType &&
    this.noticePeriod;
  if (employmentPreferencesComplete) completion += 20;

  // Skills (20%) - At least one primary skill required
  const skillsComplete =
    Array.isArray(this.primarySkills) &&
    this.primarySkills.length > 0 &&
    this.primarySkills[0] &&
    this.primarySkills[0].trim() !== '';
  if (skillsComplete) completion += 20;

  // Education (15%) - At least one education entry with all required fields
  const educationComplete =
    Array.isArray(this.education) &&
    this.education.length > 0 &&
    this.education[0].degree &&
    this.education[0].institution &&
    this.education[0].passingYear &&
    this.education[0].grade;
  if (educationComplete) completion += 15;

  // Language (5%) - Language selected
  if (this.language) completion += 5;

  this.profileCompletionPercentage = completion;
  return completion;
};

// Calculate profile completion before saving
userSchema.pre('save', function (next) {
  // Calculate completion for all saves (both new and updates)
  // Skip only if this is a new document with minimal data
  if (this.isNew) {
    // For new documents, calculate after initial save
    this.calculateProfileCompletion();
  } else {
    // For updates, always recalculate
    this.calculateProfileCompletion();
  }
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;