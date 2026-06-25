const prisma = require('../../prisma/client');

/**
 * Send a notification to a specific user and emit to their socket room
 */
const notifyUser = async (userId, { title, message, type, relatedModule, relatedRecordId }) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type: type || 'SYSTEM',
        relatedModule,
        relatedRecordId: relatedRecordId ? String(relatedRecordId) : null
      }
    });

    if (global.io) {
      global.io.to(`user_${userId}`).emit('new_notification', notification);
    }
    return notification;
  } catch (error) {
    console.error(`Error in notifyUser for user ${userId}:`, error);
  }
};

/**
 * Send a notification to all active users with a specific role
 */
const notifyRole = async (roleName, { title, message, type, relatedModule, relatedRecordId }) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: {
          name: roleName
        },
        isActive: true,
        deletedAt: null
      }
    });

    const notifications = [];
    for (const user of users) {
      const notification = await prisma.notification.create({
        data: {
          userId: user.id,
          title,
          message,
          type: type || 'SYSTEM',
          relatedModule,
          relatedRecordId: relatedRecordId ? String(relatedRecordId) : null
        }
      });
      notifications.push(notification);

      if (global.io) {
        global.io.to(`user_${user.id}`).emit('new_notification', notification);
      }
    }
    return notifications;
  } catch (error) {
    console.error(`Error in notifyRole for role ${roleName}:`, error);
  }
};

/**
 * Create a notification for a specific user (compatibility wrapper)
 */
const createNotification = async (payload) => {
  return notifyUser(payload.userId, payload);
};

/**
 * Create notification for all Admin and Super Admin users (compatibility wrapper)
 */
const notifyAdmins = async (payload) => {
  await notifyRole('Admin', payload);
  await notifyRole('Super Admin', payload);
};

module.exports = {
  notifyUser,
  notifyRole,
  createNotification,
  notifyAdmins
};
