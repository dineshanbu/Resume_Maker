// backend/src/models/Notification.model.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  type: {
    type: String,
    enum: ['NEW_TEMPLATE', 'JOB_ALERT', 'APPLICATION_UPDATE', 'SYSTEM', 'GENERAL'],
    default: 'GENERAL',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  link: {
    type: String,
    trim: true,
    default: null
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  icon: {
    type: String,
    default: 'bi-bell'
  },
  iconColor: {
    type: String,
    default: '#1d88ed'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index for faster queries
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });

// Static method to create notification for a user
notificationSchema.statics.createForUser = async function(userId, notificationData) {
  return await this.create({
    userId,
    ...notificationData
  });
};

// Static method to create notifications for multiple users
notificationSchema.statics.createForUsers = async function(userIds, notificationData) {
  const notifications = userIds.map(userId => ({
    userId,
    ...notificationData
  }));
  return await this.insertMany(notifications);
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
