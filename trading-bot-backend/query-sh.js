const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function main() { 
  const inv = await prisma.invoice.findFirst({ 
    where: { invoiceNumber: 'INV-1004' }, 
    include: { items: true, client: true } 
  }); 
  console.log(JSON.stringify(inv, null, 2)); 
} 
main().catch(console.error).finally(() => prisma.$disconnect());
