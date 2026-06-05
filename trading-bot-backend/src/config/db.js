const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
});

// Middleware to automatically cast string IDs to integers
prisma.$use(async (params, next) => {
  const castIdsToNumbers = (obj) => {
    if (Array.isArray(obj)) {
      obj.forEach(castIdsToNumbers);
    } else if (obj !== null && typeof obj === 'object') {
      for (const key of Object.keys(obj)) {
        if ((key === 'id' || key.endsWith('Id') || key.endsWith('ById')) && typeof obj[key] === 'string') {
          const num = Number(obj[key]);
          if (!isNaN(num) && obj[key].trim() !== '') {
            obj[key] = num;
          }
        } else if (typeof obj[key] === 'object') {
          castIdsToNumbers(obj[key]);
        }
      }
    }
  };

  if (params.args) {
    castIdsToNumbers(params.args);
  }

  return next(params);
});

const { asyncLocalStorage } = require('../utils/context');

const prismaExtended = prisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const result = await query(args);
        
        if (['create', 'update', 'delete'].includes(operation) && model !== 'Notification' && model !== 'AuditLog') {
          const store = asyncLocalStorage.getStore();
          if (store && store.user) {
            const user = store.user;
            let action = operation === 'create' ? 'created' : operation === 'update' ? 'updated' : 'deleted';
            let title = `${model} ${action}`;
            let message = `A ${model} record was ${action} by ${user.role?.name || 'user'}`;
            
            try {
              const notification = await prisma.notification.create({
                data: {
                  userId: user.id,
                  title,
                  message,
                  type: 'SYSTEM',
                  relatedModule: model,
                  relatedRecordId: result.id ? Number(result.id) : null,
                }
              });
              
              if (global.io) {
                global.io.emit('new_notification', notification);
              }
            } catch (err) {
              console.error('Failed to create automatic notification', err);
            }
          }
        }
        return result;
      }
    }
  }
});

module.exports = prismaExtended;
