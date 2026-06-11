const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function main() { 
  await prisma.invoice.create({ 
    data: { 
      invoiceNumber: 'INV-9999', 
      clientId: 3305, 
      status: 'DRAFT', 
      subtotal: 100, 
      tax: 10, 
      total: 110, 
      pendingAmount: 110, 
      paidAmount: 0 
    } 
  }); 
  console.log('Created!'); 
} 
main().catch(console.error).finally(() => prisma.$disconnect());
