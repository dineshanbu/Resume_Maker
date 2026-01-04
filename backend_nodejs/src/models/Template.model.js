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
  
  // Template thumbnail preview
  thumbnail: {
    type: String,
    required: true
  },
  
  // HTML Template content
  htmlTemplate: {
    type: String,
    required: true
  },
  
  // CSS for the template
  cssTemplate: {
    type: String,
    required: true
  },
  
  // Profession/Category
  profession: {
    type: String,
    required: true,
    enum: [
      'Software Engineer',
      'Data Scientist',
      'Marketing Professional',
      'Sales Executive',
      'Designer',
      'Teacher',
      'Healthcare',
      'Finance',
      'HR Professional',
      'Student/Fresher',
      'Manager',
      'General'
    ],
    index: true
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
  
  // Subscription tier required
  subscriptionTier: {
    type: String,
    enum: ['free', 'basic', 'premium'],
    default: 'free',
    index: true
  },
  
  // Template metadata
  isActive: {
    type: Boolean,
    default: true
  },
  
  isPremium: {
    type: Boolean,
    default: false
  },
  
  usageCount: {
    type: Number,
    default: 0
  },
  
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
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
  }
  
}, {
  timestamps: true
});

// Indexes
templateSchema.index({ profession: 1, subscriptionTier: 1 });
templateSchema.index({ isActive: 1, isPremium: 1 });
templateSchema.index({ tags: 1 });

// Increment usage count
templateSchema.methods.incrementUsage = async function() {
  this.usageCount += 1;
  await this.save();
};

// Add rating
templateSchema.methods.addRating = async function(rating) {
  const totalRating = (this.rating.average * this.rating.count) + rating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
  await this.save();
};

// Get templates by profession
templateSchema.statics.getByProfession = async function(profession, userTier = 'free') {
  const tiers = {
    free: ['free'],
    basic: ['free', 'basic'],
    premium: ['free', 'basic', 'premium']
  };
  
  return await this.find({
    profession: profession,
    subscriptionTier: { $in: tiers[userTier] },
    isActive: true
  }).sort({ usageCount: -1 });
};

const Template = mongoose.model('Template', templateSchema);

module.exports = Template;