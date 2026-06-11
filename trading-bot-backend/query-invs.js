const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function main() { 
  const invs = await prisma.invoice.findMany({
    select: { invoiceNumber: true, status: true, id: true, inquiryId: true, shipmentId: true }
  });
  console.table(invs);
} 
main().catch(console.error).finally(() => prisma.$disconnect());
