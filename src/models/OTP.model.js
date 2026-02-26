// backend/src/models/OTP.model.js
const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    index: true
  },
  otpCode: {
    type: String,
    required: [true, 'OTP code is required'],
    trim: true,
    validate: {
      validator: function (v) {
        return /^\d{6}$/.test(v);
      },
      message: 'OTP must be exactly 6 digits'
    }
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiry date is required'],
    index: { expireAfterSeconds: 0 } // Auto-delete expired documents
  },
  isUsed: {
    type: Boolean,
    default: false,
    index: true
  },
  resendCount: {
    type: Number,
    default: 0
  },

}, {
  timestamps: true
});

// Index for faster queries
otpSchema.index({ email: 1, isUsed: 1 });
otpSchema.index({ userId: 1, isUsed: 1 });

// Method to check if OTP is valid
otpSchema.methods.isValid = function () {
  return !this.isUsed && this.expiresAt > new Date();
};

// Static method to generate 6-digit OTP
otpSchema.statics.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log('🔢 Generated OTP:', otp, 'Type:', typeof otp, 'Length:', otp.length);
  return otp;
};

// Static method to create OTP with expiry (default 1 minute)
otpSchema.statics.createOTP = async function (userId, email, expiryMinutes = 1) {
  // Invalidate all previous unused OTPs for this user/email
  await this.updateMany(
    { userId, email, isUsed: false },
    { isUsed: true }
  );

  const otpCode = String(this.generateOTP()).trim();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

  console.log('💾 Creating OTP:', {
    userId,
    email,
    otpCode,
    otpCodeType: typeof otpCode,
    otpCodeLength: otpCode.length,
    expiresAt
  });

  const createdOtp = await this.create({
    userId,
    email: email.toLowerCase(),
    otpCode,
    expiresAt
  });

  console.log('✅ OTP created in DB:', {
    _id: createdOtp._id,
    otpCode: createdOtp.otpCode,
    email: createdOtp.email
  });

  return createdOtp;
};

// Static method to verify OTP
otpSchema.statics.verifyOTP = async function (email, otpCode) {
  // Normalize inputs
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedOtp = String(otpCode).trim();

  console.log('🔍 Verifying OTP:', {
    email: normalizedEmail,
    otpCode: normalizedOtp,
    otpCodeLength: normalizedOtp.length
  });

  // Find OTP - check both used and unused to provide better error messages
  const otp = await this.findOne({
    email: normalizedEmail,
    otpCode: normalizedOtp
  }).sort({ createdAt: -1 }); // Get most recent OTP

  if (!otp) {
    // Check if there are any OTPs for this email to provide better error
    const anyOtp = await this.findOne({ email: normalizedEmail }).sort({ createdAt: -1 });
    if (anyOtp) {
      console.log('❌ OTP not found. Latest OTP for email:', {
        foundOtpCode: anyOtp.otpCode,
        providedOtpCode: normalizedOtp,
        isUsed: anyOtp.isUsed,
        expiresAt: anyOtp.expiresAt,
        now: new Date()
      });
      return { valid: false, message: `Invalid OTP code. Expected: ${anyOtp.otpCode}, Got: ${normalizedOtp}` };
    }
    return { valid: false, message: 'Invalid OTP code' };
  }

  console.log('✓ OTP found:', {
    otpCode: otp.otpCode,
    isUsed: otp.isUsed,
    expiresAt: otp.expiresAt,
    now: new Date(),
    isExpired: otp.expiresAt < new Date()
  });

  if (otp.isUsed) {
    return { valid: false, message: 'OTP has already been used' };
  }

  if (otp.expiresAt < new Date()) {
    const expiredSeconds = Math.floor((new Date() - otp.expiresAt) / 1000);
    return { valid: false, message: `OTP has expired ${expiredSeconds} seconds ago` };
  }

  // Mark as used
  otp.isUsed = true;
  await otp.save();

  console.log('✅ OTP verified successfully');
  return { valid: true, otp, userId: otp.userId };
};

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
