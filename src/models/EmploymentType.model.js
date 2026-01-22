// backend/src/models/EmploymentType.model.js
const mongoose = require('mongoose');

const employmentTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Employment type name is required'],
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
employmentTypeSchema.index({ status: 1 });

const EmploymentType = mongoose.model('EmploymentType', employmentTypeSchema);

module.exports = EmploymentType;
