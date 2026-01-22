// backend/src/models/TemplateRating.model.js
const mongoose = require('mongoose');

const templateRatingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template',
    required: true,
    index: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be an integer between 1 and 5'
    }
  },
  review: {
    type: String,
    maxlength: [300, 'Review cannot exceed 300 characters'],
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['approved', 'pending', 'rejected'],
    default: 'pending',
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound unique index: one rating per user per template
templateRatingSchema.index({ userId: 1, templateId: 1 }, { unique: true });

// Index for template ratings query
templateRatingSchema.index({ templateId: 1, status: 1 });

// Index for admin moderation
templateRatingSchema.index({ status: 1, createdAt: -1 });

// Update updatedAt on save
templateRatingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to calculate average rating for a template
templateRatingSchema.statics.calculateAverageRating = async function(templateId) {
  const result = await this.aggregate([
    {
      $match: {
        templateId: new mongoose.Types.ObjectId(templateId),
        status: 'approved'
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 }
      }
    }
  ]);

  if (result.length === 0) {
    return { averageRating: 0, totalRatings: 0 };
  }

  return {
    averageRating: Math.round(result[0].averageRating * 10) / 10, // Round to 1 decimal
    totalRatings: result[0].totalRatings
  };
};

// Instance method to update template rating stats
templateRatingSchema.methods.updateTemplateStats = async function() {
  const Template = mongoose.model('Template');
  const stats = await this.constructor.calculateAverageRating(this.templateId);
  
  await Template.findByIdAndUpdate(this.templateId, {
    averageRating: stats.averageRating,
    totalRatings: stats.totalRatings
  });
};

const TemplateRating = mongoose.model('TemplateRating', templateRatingSchema);

module.exports = TemplateRating;
