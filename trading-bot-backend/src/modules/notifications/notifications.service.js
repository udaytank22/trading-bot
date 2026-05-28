const prisma = require('../../prisma/client');

/**
 * Create a notification for a specific user
 */
const createNotification = async ({ userId, title, message, type, relatedModule, relatedRecordId }) => {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type, // inquiry, purchase-order, document, supply, system
        relatedModule,
        relatedRecordId: relatedRecordId ? String(relatedRecordId) : null
      }
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

/**
 * Create notification for all Admin and Super Admin users
 */
const notifyAdmins = async ({ title, message, type, relatedModule, relatedRecordId }) => {
  try {
    const admins = await prisma.user.findMany({
      where: {
        role: {
          name: {
            in: ['Super Admin', 'Admin']
          }
        },
        isActive: true,
        deletedAt: null
      }
    });

    const notifications = admins.map((admin) => ({
      userId: admin.id,
      title,
      message,
      type,
      relatedModule,
      relatedRecordId: relatedRecordId ? String(relatedRecordId) : null
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications
      });
    }
  } catch (error) {
    console.error('Error sending notifications to admins:', error);
  }
};

module.exports = {
  createNotification,
  notifyAdmins
};
