// backend/src/models/PlanMaster.model.js
const mongoose = require('mongoose');

const planMasterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Plan name is required'],
    trim: true,
    unique: true
  },
  planName: {
    type: String,
    trim: true
  },
  features: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, {
  timestamps: true
});

planMasterSchema.index({ status: 1 });

const PlanMaster = mongoose.model('PlanMaster', planMasterSchema);

module.exports = PlanMaster;
