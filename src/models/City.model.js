// backend/src/models/City.model.js
const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'City name is required'],
    trim: true
  },
  stateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'State',
    required: [true, 'State is required']
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
citySchema.index({ stateId: 1 });
citySchema.index({ countryId: 1 });
citySchema.index({ status: 1 });
citySchema.index({ stateId: 1, name: 1 }, { unique: true }); // Unique city per state

const City = mongoose.model('City', citySchema);

module.exports = City;
