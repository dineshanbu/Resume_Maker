// backend/src/models/SalaryRange.model.js
const mongoose = require('mongoose');

const salaryRangeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Salary range name is required'],
    trim: true,
    unique: true
  },
  minSalary: {
    type: Number,
    required: [true, 'Minimum salary is required'],
    min: 0
  },
  maxSalary: {
    type: Number,
    required: [true, 'Maximum salary is required'],
    min: 0
  },
  currencyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Currency',
    required: false
  },
  currencyName: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, {
  timestamps: true
});

salaryRangeSchema.index({ status: 1 });

const SalaryRange = mongoose.model('SalaryRange', salaryRangeSchema);

module.exports = SalaryRange;
