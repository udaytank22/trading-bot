const chatService = require('./chat.service');
const { sendResponse, sendError } = require('../../utils/response');

const getUsers = async (req, res, next) => {
  try {
    const users = await chatService.getChatUsers(req.user.userId);
    return sendResponse(res, 'Chat users fetched successfully', users);
  } catch (error) {
    next(error);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const otherUserId = parseInt(req.params.userId, 10);
    const messages = await chatService.getMessages(req.user.userId, otherUserId);
    return sendResponse(res, 'Messages fetched successfully', messages);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getMessages
};
