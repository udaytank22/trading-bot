const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
});

// Audit Log Middleware
prisma.$use(async (params, next) => {
  const { asyncLocalStorage } = require('../utils/context');
  
  if (params.model === 'AuditLog' || params.model === 'Session') {
    return next(params);
  }

  const auditedActions = ['create', 'update', 'delete', 'createMany', 'updateMany', 'deleteMany'];
  if (!auditedActions.includes(params.action)) {
    return next(params);
  }

  const store = asyncLocalStorage ? asyncLocalStorage.getStore() : null;
  const user = store?.user;
  const req = store?.req;

  let oldValue = null;
  if (['update', 'delete'].includes(params.action) && params.args && params.args.where) {
    try {
      // Find the old value before updating/deleting
      oldValue = await prisma[params.model].findFirst({
        where: params.args.where
      });
    } catch (e) {
      // Ignore errors when fetching oldValue
    }
  }

  // Execute the actual query
  const result = await next(params);

  // Log to AuditLog (fire and forget)
  try {
    let recordId = null;
    if (result && result.id) {
      recordId = result.id;
    } else if (params.args && params.args.where && params.args.where.id) {
      recordId = params.args.where.id;
    }

    prisma.auditLog.create({
      data: {
        module: params.model || 'Unknown',
        action: params.action.toUpperCase(),
        recordId: recordId ? parseInt(recordId, 10) : null,
        oldValue: oldValue ? JSON.stringify(oldValue) : null,
        newValue: (['create', 'update'].includes(params.action) && result) ? JSON.stringify(result) : null,
        ipAddress: req?.ip || null,
        userAgent: req?.headers ? req.headers['user-agent'] : null,
        userId: user?.id || null
      }
    }).catch(e => console.error('Audit Log Write Failed:', e));
  } catch (err) {
    console.error('Failed to create audit log', err);
  }

  return result;
});

module.exports = prisma;
