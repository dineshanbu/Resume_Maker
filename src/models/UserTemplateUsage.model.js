// backend/src/models/UserTemplateUsage.model.js
const mongoose = require('mongoose');

/**
 * UserTemplateUsage Model
 * 
 * CRITICAL ARCHITECTURAL COMPONENT:
 * This collection is the SINGLE SOURCE OF TRUTH for template entitlement tracking.
 * 
 * WHY THIS EXISTS:
 * - Array-based tracking in User document (freeTemplateIdsUsed) is logically flawed
 * - MongoDB $expr + $size + $addToSet does NOT enforce hard limits reliably
 * - $or conditions can bypass array-length constraints
 * - This collection provides mathematically correct entitlement enforcement
 * 
 * BUSINESS RULES:
 * - Each (userId, templateId) pair represents ONE template usage entitlement
 * - Unique index prevents duplicate template usage tracking
 * - Count of documents per userId = number of distinct templates used
 * - Status (Draft/Completed) does NOT affect entitlement tracking
 * - Template limits apply to ALL resume statuses
 * 
 * ENFORCEMENT FLOW:
 * 1. Premium template check (plan.features.premiumTemplatesAccess)
 * 2. For free templates on free plans:
 *    a) Check if (userId, templateId) exists → ALLOW (reuse)
 *    b) Count documents where userId = X
 *    c) If count < maxFreeTemplates → INSERT → ALLOW
 *    d) If count >= maxFreeTemplates → BLOCK
 */
const userTemplateUsageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true // Index for fast userId queries
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template',
    required: [true, 'Template ID is required']
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// CRITICAL: Unique compound index prevents duplicate template usage
// This ensures each (userId, templateId) pair can only exist once
// Attempting to insert duplicate will fail with E11000 error
userTemplateUsageSchema.index(
  { userId: 1, templateId: 1 },
  { unique: true, name: 'unique_user_template' }
);

// Index on userId for fast counting queries
userTemplateUsageSchema.index({ userId: 1 });

// Index on templateId for analytics/reporting (optional but useful)
userTemplateUsageSchema.index({ templateId: 1 });

const UserTemplateUsage = mongoose.model('UserTemplateUsage', userTemplateUsageSchema);

module.exports = UserTemplateUsage;
