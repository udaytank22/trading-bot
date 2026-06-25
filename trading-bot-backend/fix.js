const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();
prisma.inquiry.update({ 
  where: { inquiryNumber: 'INQ-1005' }, 
  data: { currentStatus: 'TL_REVIEW', inventoryFulfilled: true } 
}).then(res => console.log('Updated')).finally(() => prisma.$disconnect());
