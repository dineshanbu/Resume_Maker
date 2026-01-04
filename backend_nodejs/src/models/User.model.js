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
  
  // OAuth Integration
  authProvider: {
    type: String,
    enum: ['local', 'google', 'linkedin'],
    default: 'local'
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
    enum: ['Free', 'Basic', 'Premium'],
    default: 'Free'
  },
  
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
  }
  
}, {
  timestamps: true
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ referralCode: 1 });

// Hash password before saving (only for local auth)
userSchema.pre('save', async function(next) {
  // Only hash password if it's modified and user is using local auth
  if (!this.isModified('password') || this.authProvider !== 'local') {
    return next();
  }
  
  // Password is required for local auth
  if (!this.password && this.authProvider === 'local') {
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
userSchema.pre('save', function(next) {
  if (!this.referralCode) {
    this.referralCode = this._id.toString().substring(0, 8).toUpperCase();
  }
  next();
});

// Method to compare password (for local auth)
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (this.authProvider !== 'local') {
    throw new Error('Password comparison not available for OAuth users');
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile
userSchema.methods.getPublicProfile = function() {
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
userSchema.statics.findOrCreateFromGoogle = async function(profile) {
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
userSchema.methods.canAccessFeature = async function(featureName) {
  const UserSubscription = mongoose.model('UserSubscription');
  const subscription = await UserSubscription.findOne({ userId: this._id });
  
  if (!subscription || !subscription.isActive()) {
    // Free plan limitations
    return false;
  }
  
  return await subscription.hasFeature(featureName);
};

const User = mongoose.model('User', userSchema);

module.exports = User;