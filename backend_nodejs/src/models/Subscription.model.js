// backend/src/models/Subscription.model.js
const mongoose = require('mongoose');

// Subscription Plan Schema
const subscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['Free', 'Basic', 'Premium']
  },
  displayName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  
  // Pricing
  pricing: {
    monthly: {
      amount: { type: Number, required: true },
      currency: { type: String, default: 'INR' }
    },
    yearly: {
      amount: { type: Number, required: true },
      currency: { type: String, default: 'INR' },
      discount: { type: Number, default: 0 } // Percentage
    }
  },
  
  // Features
  features: {
    resumeLimit: { type: Number, default: 1 }, // -1 for unlimited
    templateAccess: { type: String, enum: ['free', 'basic', 'premium'], default: 'free' },
    pdfDownloads: { type: Number, default: 5 }, // per month, -1 for unlimited
    jobApplications: { type: Number, default: 10 }, // per month, -1 for unlimited
    customTemplates: { type: Boolean, default: false },
    prioritySupport: { type: Boolean, default: false },
    analyticsAccess: { type: Boolean, default: false },
    aiSuggestions: { type: Boolean, default: false },
    coverLetterBuilder: { type: Boolean, default: false },
    removeWatermark: { type: Boolean, default: false }
  },
  
  // Stripe Product & Price IDs (for payment integration)
  stripeProductId: String,
  stripePriceIds: {
    monthly: String,
    yearly: String
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  sortOrder: {
    type: Number,
    default: 0
  }
  
}, {
  timestamps: true
});

// User Subscription Schema
const userSubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  
  planName: {
    type: String,
    enum: ['Free', 'Basic', 'Premium'],
    default: 'Free'
  },
  
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  
  // Subscription status
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired', 'paused'],
    default: 'active',
    index: true
  },
  
  // Dates
  startDate: {
    type: Date,
    default: Date.now
  },
  
  endDate: {
    type: Date,
    required: true
  },
  
  nextBillingDate: Date,
  
  cancelledAt: Date,
  
  // Usage tracking
  usage: {
    resumesCreated: { type: Number, default: 0 },
    pdfDownloads: { type: Number, default: 0 },
    jobApplications: { type: Number, default: 0 },
    lastResetDate: { type: Date, default: Date.now }
  },
  
  // Payment details
  paymentMethod: {
    type: String,
    enum: ['card', 'upi', 'netbanking', 'wallet'],
    default: 'card'
  },
  
  // Stripe/Payment Gateway IDs
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  
  // Auto-renewal
  autoRenew: {
    type: Boolean,
    default: true
  },
  
  // Promo code
  promoCode: String,
  discount: {
    type: Number,
    default: 0
  }
  
}, {
  timestamps: true
});

// Payment Transaction Schema
const paymentTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserSubscription'
  },
  
  // Transaction details
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  
  amount: {
    type: Number,
    required: true
  },
  
  currency: {
    type: String,
    default: 'INR'
  },
  
  // Payment info
  planName: String,
  billingCycle: String,
  
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'refunded'],
    default: 'pending',
    index: true
  },
  
  paymentMethod: String,
  paymentGateway: {
    type: String,
    enum: ['stripe', 'razorpay', 'paypal'],
    default: 'razorpay'
  },
  
  // Gateway specific IDs
  gatewayTransactionId: String,
  gatewayOrderId: String,
  
  // Metadata
  metadata: mongoose.Schema.Types.Mixed,
  
  failureReason: String,
  
  refundedAt: Date,
  refundAmount: Number
  
}, {
  timestamps: true
});

// Indexes
userSubscriptionSchema.index({ userId: 1, status: 1 });
userSubscriptionSchema.index({ endDate: 1 });
paymentTransactionSchema.index({ userId: 1, createdAt: -1 });
paymentTransactionSchema.index({ status: 1 });

// Methods for UserSubscription

// Check if subscription is active
userSubscriptionSchema.methods.isActive = function() {
  return this.status === 'active' && this.endDate > new Date();
};

// Check if feature is available
userSubscriptionSchema.methods.hasFeature = async function(feature) {
  const plan = await SubscriptionPlan.findOne({ name: this.planName });
  if (!plan) return false;
  return plan.features[feature];
};

// Reset monthly usage
userSubscriptionSchema.methods.resetMonthlyUsage = async function() {
  const now = new Date();
  const lastReset = new Date(this.usage.lastResetDate);
  
  // Check if a month has passed
  if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
    this.usage.pdfDownloads = 0;
    this.usage.jobApplications = 0;
    this.usage.lastResetDate = now;
    await this.save();
  }
};

// Check and increment usage
userSubscriptionSchema.methods.canUseFeature = async function(featureName) {
  await this.resetMonthlyUsage();
  
  const plan = await SubscriptionPlan.findOne({ name: this.planName });
  if (!plan) return false;
  
  const limit = plan.features[featureName];
  
  // -1 means unlimited
  if (limit === -1) return true;
  
  const currentUsage = this.usage[featureName] || 0;
  return currentUsage < limit;
};

// Increment usage
userSubscriptionSchema.methods.incrementUsage = async function(featureName) {
  if (!this.usage[featureName]) {
    this.usage[featureName] = 0;
  }
  this.usage[featureName] += 1;
  await this.save();
};

// Cancel subscription
userSubscriptionSchema.methods.cancel = async function() {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.autoRenew = false;
  await this.save();
};

// Renew subscription
userSubscriptionSchema.methods.renew = async function(billingCycle) {
  const plan = await SubscriptionPlan.findOne({ name: this.planName });
  
  const duration = billingCycle === 'yearly' ? 365 : 30;
  this.endDate = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
  this.nextBillingDate = this.endDate;
  this.status = 'active';
  
  await this.save();
};

// Static method to check expired subscriptions
userSubscriptionSchema.statics.expireOldSubscriptions = async function() {
  const result = await this.updateMany(
    {
      status: 'active',
      endDate: { $lt: new Date() }
    },
    {
      $set: { status: 'expired' }
    }
  );
  return result;
};

const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
const UserSubscription = mongoose.model('UserSubscription', userSubscriptionSchema);
const PaymentTransaction = mongoose.model('PaymentTransaction', paymentTransactionSchema);

module.exports = {
  SubscriptionPlan,
  UserSubscription,
  PaymentTransaction
};