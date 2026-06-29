const prisma = require('../prisma/client');
const { verifyAccessToken } = require('../utils/token');
const { sendError } = require('../utils/response');
const { getUserFromCache, setUserInCache } = require('../utils/cache');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authorization header missing or invalid', [], 401);
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      return sendError(res, 'Access token is invalid or has expired', [], 401);
    }

    const { getOrFetchUser } = require('../utils/cache');

    const user = await getOrFetchUser(decoded.userId, async (id) => {
      return await prisma.user.findFirst({
        where: {
          id: id,
          isActive: true,
          deletedAt: null
        },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      });
    });

    if (!user) {
      return sendError(res, 'User account is deactivated or deleted', [], 401);
    }

    req.user = user;
    
    // Store user and req in async context
    const { asyncLocalStorage } = require('../utils/context');
    asyncLocalStorage.run({ user, req }, () => {
      next();
    });
  } catch (error) {
    return sendError(res, 'Authentication middleware error', error.message, 500);
  }
};

module.exports = authMiddleware;
