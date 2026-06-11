const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function main() { 
  const inqs = await prisma.inquiry.findMany({ where: { currentStatus: 'CHALLAN_RECEIVED' }, include: { clientQuotations: true } }); 
  console.log(JSON.stringify(inqs.map(i => ({id: i.id, q: i.clientQuotations.length})), null, 2)); 
} 
main().catch(console.error).finally(() => prisma.$disconnect());
