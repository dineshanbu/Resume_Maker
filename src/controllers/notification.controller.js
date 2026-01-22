// backend/src/controllers/notification.controller.js
const Notification = require('../models/Notification.model');
const asyncHandler = require('../utils/asyncHandler');
const {
  successResponse,
  notFoundResponse,
  badRequestResponse
} = require('../utils/apiResponse');

/**
 * @desc    Get all notifications for current user
 * @route   GET /api/v1/notifications
 * @access  Private
 */
const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { isRead, limit = 50 } = req.query;

  // Build query
  const query = { userId };
  if (isRead !== undefined) {
    query.isRead = isRead === 'true';
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  const unreadCount = await Notification.countDocuments({
    userId,
    isRead: false
  });

  return successResponse(res, {
    notifications,
    unreadCount
  });
});

/**
 * @desc    Mark notification as read
 * @route   PATCH /api/v1/notifications/:id/read
 * @access  Private
 */
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!notification) {
    return notFoundResponse(res, 'Notification not found');
  }

  notification.isRead = true;
  await notification.save();

  return successResponse(res, { notification }, 'Notification marked as read');
});

/**
 * @desc    Mark all notifications as read
 * @route   PATCH /api/v1/notifications/read-all
 * @access  Private
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { userId: req.user._id, isRead: false },
    { $set: { isRead: true } }
  );

  return successResponse(
    res,
    { updatedCount: result.modifiedCount },
    `${result.modifiedCount} notification(s) marked as read`
  );
});

/**
 * @desc    Delete notification
 * @route   DELETE /api/v1/notifications/:id
 * @access  Private
 */
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!notification) {
    return notFoundResponse(res, 'Notification not found');
  }

  return successResponse(res, null, 'Notification deleted successfully');
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
