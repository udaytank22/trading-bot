const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const models = [
    'payment', 'invoiceItem', 'invoice', 'shipment', 'purchaseOrderItem', 'purchaseOrder',
    'approvalLog', 'clientQuotationItem', 'clientQuotation', 'supplierQuoteItem', 'supplierQuote',
    'inquiryStatusHistory', 'inquirySupplier', 'inquiryItem', 'inquiry', 'product',
    'clientVessel', 'client', 'supplier', 'stockMovement', 'warehouseStock', 'inventoryItem',
    'warehouse', 'attendance', 'document', 'notification', 'auditLog', 'vehicle', 'employee', 'bankAccount'
  ];
  for (const m of models) {
    await prisma[m].deleteMany({});
    console.log('Cleared ' + m);
  }
  console.log('Done');
}
main().catch(console.error).finally(() => prisma.$disconnect());
