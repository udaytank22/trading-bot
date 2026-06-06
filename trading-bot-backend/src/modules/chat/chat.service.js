const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getChatUsers = async (currentUserId) => {
  // Get all active users except current
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      id: { not: currentUserId }
    },
    select: {
      id: true,
      email: true,
      employeeProfile: { select: { fullName: true } }
    }
  });

  // map to a nice format
  return users.map(u => ({
    id: u.id,
    name: u.employeeProfile?.fullName || u.email.split('@')[0],
    email: u.email
  }));
};

const getMessages = async (userId1, userId2) => {
  return await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 }
      ]
    },
    orderBy: { createdAt: 'asc' }
  });
};

const saveMessage = async (data) => {
  return await prisma.message.create({
    data
  });
};

const markAsRead = async (senderId, receiverId) => {
  return await prisma.message.updateMany({
    where: {
      senderId: senderId,
      receiverId: receiverId,
      isRead: false
    },
    data: {
      isRead: true
    }
  });
};

module.exports = {
  getChatUsers,
  getMessages,
  saveMessage,
  markAsRead
};
