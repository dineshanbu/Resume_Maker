// backend/src/models/Template.model.js
const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  displayName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },

  // Template thumbnail preview (legacy)
  thumbnail: {
    type: String,
    required: false
  },

  // Template preview image (Cloudinary URL) - Required
  thumbnailImage: {
    type: String,
    required: true,
    trim: true
  },

  // HTML Template content
  htmlTemplate: {
    type: String,
    required: false
  },

  // Template HTML (placeholder-based) - Primary field
  templateHtml: {
    type: String,
    required: true
  },

  // CSS for the template
  cssTemplate: {
    type: String,
    required: false
  },

  // Category reference (from Template Category Master)
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TemplateCategory',
    required: true,
    index: true
  },

  // Profession/Category (deprecated - use categoryId)
  profession: {
    type: String,
    required: false,

  },

  // Template style category
  styleCategory: {
    type: String,
    enum: ['Modern', 'Classic', 'Creative', 'Minimal', 'Professional'],
    default: 'Professional'
  },

  // Color scheme
  colorScheme: {
    primary: { type: String, default: '#2c3e50' },
    secondary: { type: String, default: '#3498db' },
    accent: { type: String, default: '#e74c3c' },
    text: { type: String, default: '#333333' },
    background: { type: String, default: '#ffffff' }
  },

  // Available sections in this template
  availableSections: {
    personalInfo: { type: Boolean, default: true },
    summary: { type: Boolean, default: true },
    experience: { type: Boolean, default: true },
    education: { type: Boolean, default: true },
    skills: { type: Boolean, default: true },
    projects: { type: Boolean, default: false },
    certifications: { type: Boolean, default: false },
    languages: { type: Boolean, default: false },
    achievements: { type: Boolean, default: false },
    interests: { type: Boolean, default: false },
    references: { type: Boolean, default: false }
  },



  // Template metadata
  isActive: {
    type: Boolean,
    default: true
  },

  // Status field (Active/Inactive) - Primary status field
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
    index: true
  },

  accessType: {
    type: String,
    enum: ['FREE', 'PREMIUM', 'BOTH'],
    default: 'FREE',
    index: true
  },

  // Created by admin user
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },

  usageCount: {
    type: Number,
    default: 0
  },

  // Rating fields (legacy - kept for backward compatibility)
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },

  // New rating fields (primary)
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0,
    min: 0
  },
  ratingEnabled: {
    type: Boolean,
    default: true
  },

  tags: [String],

  // Custom fields configuration
  customFields: [{
    fieldName: String,
    fieldType: String, // text, textarea, number, date
    label: String,
    placeholder: String,
    required: Boolean,
    section: String
  }],

  // Preview data for demo
  previewData: {
    type: mongoose.Schema.Types.Mixed
  },

  // --- Master Configuration References ---
  adminLayoutId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminLayout',
    required: false
  },
  themeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Theme',
    required: false
  },
  sectionLayouts: {
    header: { type: mongoose.Schema.Types.ObjectId, ref: 'SectionLayout' },
    summary: { type: mongoose.Schema.Types.ObjectId, ref: 'SectionLayout' },
    experience: { type: mongoose.Schema.Types.ObjectId, ref: 'SectionLayout' },
    education: { type: mongoose.Schema.Types.ObjectId, ref: 'SectionLayout' },
    skills: { type: mongoose.Schema.Types.ObjectId, ref: 'SectionLayout' },
    projects: { type: mongoose.Schema.Types.ObjectId, ref: 'SectionLayout' },
    certifications: { type: mongoose.Schema.Types.ObjectId, ref: 'SectionLayout' },
    languages: { type: mongoose.Schema.Types.ObjectId, ref: 'SectionLayout' },
    achievements: { type: mongoose.Schema.Types.ObjectId, ref: 'SectionLayout' },
    interests: { type: mongoose.Schema.Types.ObjectId, ref: 'SectionLayout' },
    references: { type: mongoose.Schema.Types.ObjectId, ref: 'SectionLayout' }
  },

  // JSON Config for the new builder
  config: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  }

}, {
  timestamps: true
});

// Indexes
templateSchema.index({ profession: 1, subscriptionTier: 1 });
templateSchema.index({ isActive: 1, isPremium: 1 });
templateSchema.index({ status: 1, categoryId: 1 });
templateSchema.index({ categoryId: 1, status: 1 });
templateSchema.index({ tags: 1 });

// Pre-save hook to sync status with isActive for backward compatibility
templateSchema.pre('save', function (next) {
  // Sync status and isActive
  if (this.isModified('status') || this.isNew) {
    this.isActive = this.status === 'Active';
  } else if (this.isModified('isActive')) {
    this.status = this.isActive ? 'Active' : 'Inactive';
  }
  next();
});

// Sync status and isActive on updates
const syncStatusOnUpdate = function (next) {
  const update = this.getUpdate();

  // Handle both direct updates and $set updates
  const setUpdate = update.$set || update;

  if (setUpdate.status !== undefined) {
    setUpdate.isActive = setUpdate.status === 'Active';
  } else if (setUpdate.isActive !== undefined) {
    setUpdate.status = setUpdate.isActive ? 'Active' : 'Inactive';
  }

  // If we updated via $set, make sure we update the $set object
  if (update.$set) {
    update.$set = setUpdate;
  }

  next();
};

templateSchema.pre('findOneAndUpdate', syncStatusOnUpdate);
templateSchema.pre('update', syncStatusOnUpdate);
templateSchema.pre('updateOne', syncStatusOnUpdate);
templateSchema.pre('updateMany', syncStatusOnUpdate);

// Increment usage count
templateSchema.methods.incrementUsage = async function () {
  this.usageCount += 1;
  await this.save();
};

// Add rating (legacy method - kept for backward compatibility)
templateSchema.methods.addRating = async function (rating) {
  const totalRating = (this.rating.average * this.rating.count) + rating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
  // Sync with new fields
  this.averageRating = this.rating.average;
  this.totalRatings = this.rating.count;
  await this.save();
};

// Get templates by profession (legacy method - updated to be resilient)
templateSchema.statics.getByProfession = async function (profession, userTier = 'free') {
  const tierHierarchy = {
    free: ['free'],
    basic: ['free', 'basic'],
    premium: ['free', 'basic', 'premium']
  };

  const accessHierarchy = {
    free: ['FREE', 'BOTH'],
    basic: ['FREE', 'BOTH'],
    premium: ['FREE', 'PREMIUM', 'BOTH']
  };

  return await this.find({
    $and: [
      { profession: profession },
      {
        $or: [
          { status: 'Active' },
          { isActive: true }
        ]
      },
      {
        $or: [
          { subscriptionTier: { $in: tierHierarchy[userTier] } },
          { accessType: { $in: accessHierarchy[userTier] } },
          { subscriptionTier: { $exists: false }, accessType: { $exists: false } }
        ]
      }
    ]
  })
    .populate('categoryId', 'name status')
    .sort({ usageCount: -1 });
};

const Template = mongoose.model('Template', templateSchema);

module.exports = Template;