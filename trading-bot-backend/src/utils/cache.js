const NodeCache = require('node-cache');

// Standard TTL of 5 minutes (300 seconds)
const userCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

const CACHE_KEYS = {
  user: (userId) => `user_${userId}`
};

const getUserFromCache = (userId) => {
  return userCache.get(CACHE_KEYS.user(userId));
};

const setUserInCache = (userId, userData) => {
  userCache.set(CACHE_KEYS.user(userId), userData);
};

const invalidateUserCache = (userId) => {
  userCache.del(CACHE_KEYS.user(userId));
};

const invalidateAllUserCaches = () => {
  userCache.flushAll();
};

module.exports = {
  userCache,
  CACHE_KEYS,
  getUserFromCache,
  setUserInCache,
  invalidateUserCache,
  invalidateAllUserCaches
};
