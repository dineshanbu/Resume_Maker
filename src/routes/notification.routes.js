// backend/src/routes/notification.routes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require('../controllers/notification.controller');

// All notification routes require authentication
router.use(authenticate);

// Get all notifications for current user
router.get('/', getNotifications);

// Mark all notifications as read
router.patch('/read-all', markAllAsRead);

// Mark notification as read
router.patch('/:id/read', markAsRead);

// Delete notification
router.delete('/:id', deleteNotification);

module.exports = router;
