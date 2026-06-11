const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function main() { 
  await prisma.invoice.updateMany({ where: { invoiceNumber: 'INV-1004' }, data: { status: 'DRAFT' } }); 
  console.log('Done'); 
} 
main().catch(console.error).finally(() => prisma.$disconnect());
