// backend/src/models/Country.model.js
const mongoose = require('mongoose');

const countrySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Country name is required'],
    trim: true,
    unique: true
  },
  code: {
    type: String,
    required: [true, 'Country code is required'],
    trim: true,
    unique: true,
    uppercase: true
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
countrySchema.index({ code: 1 });
countrySchema.index({ status: 1 });

const Country = mongoose.model('Country', countrySchema);

module.exports = Country;
