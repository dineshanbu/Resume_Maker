// backend/src/models/State.model.js
const mongoose = require('mongoose');

const stateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'State name is required'],
    trim: true
  },
  code: {
    type: String,
    trim: true,
    uppercase: true
  },
  countryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Country',
    required: [true, 'Country is required']
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
stateSchema.index({ countryId: 1 });
stateSchema.index({ status: 1 });
stateSchema.index({ countryId: 1, name: 1 }, { unique: true }); // Unique state per country

const State = mongoose.model('State', stateSchema);

module.exports = State;
