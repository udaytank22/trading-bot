const prisma = require('../../prisma/client');
const { sendSuccess } = require('../../utils/response');

/**
 * Get all notifications for current user
 */
const getNotifications = async (req, res) => {
  const userId = req.user.id;
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });

  return sendSuccess(res, 'Notifications retrieved successfully', notifications);
};

/**
 * Mark a single notification as read
 */
const markRead = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const notifId = Number(id);

  const notification = await prisma.notification.updateMany({
    where: { 
      id: isNaN(notifId) ? id : notifId,
      userId 
    },
    data: { isRead: true }
  });

  return sendSuccess(res, 'Notification marked as read', notification);
};

/**
 * Mark all notifications for current user as read
 */
const markAllRead = async (req, res) => {
  const userId = req.user.id;

  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true }
  });

  return sendSuccess(res, 'All notifications marked as read');
};

/**
 * Delete a notification
 */
const deleteNotification = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const notifId = Number(id);

  await prisma.notification.deleteMany({
    where: { 
      id: isNaN(notifId) ? id : notifId,
      userId 
    }
  });

  return sendSuccess(res, 'Notification deleted successfully');
};

module.exports = {
  getNotifications,
  markRead,
  markAllRead,
  deleteNotification
};

