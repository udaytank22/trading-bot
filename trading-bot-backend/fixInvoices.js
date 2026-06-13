const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixInvoices() {
  const invoices = await prisma.invoice.findMany({
    where: { inquiryId: null, shipmentId: { not: null } },
    include: { shipment: true }
  });

  for (const inv of invoices) {
    if (inv.shipment && inv.shipment.inquiryId) {
      await prisma.invoice.update({
        where: { id: inv.id },
        data: { inquiryId: inv.shipment.inquiryId }
      });
      console.log(`Updated invoice ${inv.id} with inquiryId ${inv.shipment.inquiryId}`);
    }
  }
}

fixInvoices()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
