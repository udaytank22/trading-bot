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

module.exports = prisma;
