// backend/src/models/TemplateCategory.model.js
const mongoose = require('mongoose');

const templateCategorySchema = new mongoose.Schema({
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
templateCategorySchema.index({ status: 1 });

const TemplateCategory = mongoose.model('TemplateCategory', templateCategorySchema);

module.exports = TemplateCategory;
