// backend/src/services/notification.service.js
const Notification = require('../models/Notification.model');

/**
 * Create a notification for a single user
 */
const createNotification = async (userId, notificationData) => {
  try {
    const notification = await Notification.createForUser(userId, {
      type: notificationData.type || 'GENERAL',
      title: notificationData.title,
      message: notificationData.message,
      link: notificationData.link || null,
      icon: notificationData.icon || 'bi-bell',
      iconColor: notificationData.iconColor || '#1d88ed',
      metadata: notificationData.metadata || {},
      isRead: false
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Create notifications for multiple users (bulk)
 */
const createNotificationsForUsers = async (userIds, notificationData) => {
  try {
    if (!userIds || userIds.length === 0) {
      console.warn('No user IDs provided for notifications');
      return [];
    }

    const notifications = await Notification.createForUsers(userIds, {
      type: notificationData.type || 'GENERAL',
      title: notificationData.title,
      message: notificationData.message,
      link: notificationData.link || null,
      icon: notificationData.icon || 'bi-bell',
      iconColor: notificationData.iconColor || '#1d88ed',
      metadata: notificationData.metadata || {},
      isRead: false
    });

    console.log(`✓ Created ${notifications.length} notifications for users`);
    return notifications;
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    throw error;
  }
};

/**
 * Create notification for new template
 */
const createNewTemplateNotification = async (userIds, template) => {
  const categoryName = template.categoryId?.name || template.category || 'General';
  const templateName = template.displayName || template.name;
  const templateId = template._id || template.id;

  const notificationData = {
    type: 'NEW_TEMPLATE',
    title: 'New Resume Template Available',
    message: `A new resume template "${templateName}" has been added to the ${categoryName} category. Check it out now!`,
    link: `/user/resume?templateId=${templateId}`,
    icon: 'bi-file-earmark-plus',
    iconColor: '#10b981',
    metadata: {
      templateId: templateId.toString(),
      templateName,
      category: categoryName
    }
  };

  return await createNotificationsForUsers(userIds, notificationData);
};

module.exports = {
  createNotification,
  createNotificationsForUsers,
  createNewTemplateNotification
};
