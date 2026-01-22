// backend/src/models/Skill.model.js
const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Skill name is required'],
    trim: true,
    unique: true
  },
  category: {
    type: String,
    trim: true,
    default: 'General'
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
skillSchema.index({ category: 1 });
skillSchema.index({ status: 1 });

const Skill = mongoose.model('Skill', skillSchema);

module.exports = Skill;
