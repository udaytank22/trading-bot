const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning inquiry related tables...');

  // Delete dependent tables first to avoid FK constraint errors
  await prisma.payment.deleteMany({});
  await prisma.invoiceItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  
  await prisma.shipment.deleteMany({});
  
  await prisma.purchaseOrderItem.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});
  
  await prisma.clientQuotationItem.deleteMany({});
  await prisma.clientQuotation.deleteMany({});
  
  await prisma.supplierQuoteItem.deleteMany({});
  await prisma.supplierQuote.deleteMany({});
  
  await prisma.inquiryStatusHistory.deleteMany({});
  await prisma.inquirySupplier.deleteMany({});
  await prisma.inquiryItem.deleteMany({});
  await prisma.approvalLog.deleteMany({});
  
  await prisma.inquiry.deleteMany({});
  
  console.log('Inquiry related tables cleaned successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
