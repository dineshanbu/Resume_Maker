// backend/src/models/JobCategory.model.js
const mongoose = require('mongoose');

const jobCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, {
  timestamps: true
});

// Indexes
jobCategorySchema.index({ status: 1 });

const JobCategory = mongoose.model('JobCategory', jobCategorySchema);

module.exports = JobCategory;
