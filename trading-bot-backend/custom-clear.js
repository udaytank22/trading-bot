require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n🧹  Starting custom database clean-up...\n');

  const toDelete = [
    'message',
    'auditLog',
    'notification',
    'document',
    'payment',
    'invoiceItem',
    'invoice',
    'shipment',
    'purchaseOrderItem',
    'purchaseOrder',
    'approvalLog',
    'clientQuotationItem',
    'clientQuotation',
    'supplierQuoteItem',
    'supplierQuote',
    'inquiryStatusHistory',
    'inquirySupplier',
    'inquiryItem',
    'inquiry',
    'stockMovement',
    'warehouseStock',
    'warehouse',
    'inventoryItem',
    'attendance',
    'user',
    'employee',
    'bankAccount',
    'clientVessel',
    'rolePermission',
    'permission',
    'role'
  ];

  for (const model of toDelete) {
    const result = await prisma[model].deleteMany({});
    console.log(`  ✓  ${model.padEnd(26)} — ${result.count} row(s) removed`);
  }

  console.log('\n✅  Done! The following tables were NOT touched:');
  console.log('    client, supplier, product, vehicle\n');
}

main()
  .catch((err) => {
    console.error('\n❌  Error during clean-up:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
