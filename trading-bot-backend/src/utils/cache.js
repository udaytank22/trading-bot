const NodeCache = require('node-cache');

// Standard TTL of 5 minutes (300 seconds)
const userCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

const CACHE_KEYS = {
  user: (userId) => `user_${userId}`
};

const inFlightPromises = new Map();

const getOrFetchUser = async (userId, fetchFn) => {
  const cachedUser = userCache.get(CACHE_KEYS.user(userId));
  if (cachedUser) return cachedUser;

  if (inFlightPromises.has(userId)) {
    return inFlightPromises.get(userId);
  }

  const promise = fetchFn(userId)
    .then(user => {
      if (user) {
        userCache.set(CACHE_KEYS.user(userId), user);
      }
      inFlightPromises.delete(userId);
      return user;
    })
    .catch(err => {
      inFlightPromises.delete(userId);
      throw err;
    });

  inFlightPromises.set(userId, promise);
  return promise;
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
  getOrFetchUser,
  getUserFromCache,
  setUserInCache,
  invalidateUserCache,
  invalidateAllUserCaches
};
