const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
  try {
    await prisma.message.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.document.deleteMany({});
    await prisma.attendance.deleteMany({});
    await prisma.stockMovement.deleteMany({});
    await prisma.warehouseStock.deleteMany({});
    // await prisma.warehouse.deleteMany({}); // Wait, maybe warehouse is static
    // await prisma.inventoryItem.deleteMany({}); // Wait, inventory item might be static
    
    await prisma.payment.deleteMany({});
    await prisma.invoiceItem.deleteMany({});
    await prisma.invoice.deleteMany({});
    await prisma.shipment.deleteMany({});
    await prisma.purchaseOrderItem.deleteMany({});
    await prisma.purchaseOrder.deleteMany({});
    
    await prisma.approvalLog.deleteMany({});
    await prisma.clientQuotationItem.deleteMany({});
    await prisma.clientQuotation.deleteMany({});
    await prisma.supplierQuoteItem.deleteMany({});
    await prisma.supplierQuote.deleteMany({});
    await prisma.inquiryStatusHistory.deleteMany({});
    await prisma.inquirySupplier.deleteMany({});
    await prisma.inquiryItem.deleteMany({});
    await prisma.inquiry.deleteMany({});
    
    console.log("Database cleaned successfully.");
  } catch (e) {
    console.error("Error cleaning:", e);
  }
}

clean().finally(() => prisma.$disconnect());
