// backend/src/models/Currency.model.js
const mongoose = require('mongoose');

const currencySchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Currency code is required'],
    trim: true,
    unique: true,
    uppercase: true
  },
  symbol: {
    type: String,
    required: [true, 'Currency symbol is required'],
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

// Indexes
currencySchema.index({ code: 1 });
currencySchema.index({ status: 1 });

const Currency = mongoose.model('Currency', currencySchema);

module.exports = Currency;
