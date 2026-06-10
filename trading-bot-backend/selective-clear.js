/**
 * selective-clear.js
 *
 * Deletes all transactional / operational data while PRESERVING:
 *   ✅  User
 *   ✅  Product
 *   ✅  Client  (+ ClientVessel kept)
 *   ✅  Supplier  (vendor)
 *   ✅  Vehicle
 *   ✅  Employee
 *   ✅  Role / Permission / RolePermission
 *   ✅  BankAccount
 *
 * Deleted (in FK-safe order, children before parents):
 *   ❌  Payment
 *   ❌  InvoiceItem
 *   ❌  Invoice
 *   ❌  Shipment
 *   ❌  PurchaseOrderItem
 *   ❌  PurchaseOrder
 *   ❌  ApprovalLog
 *   ❌  ClientQuotationItem
 *   ❌  ClientQuotation
 *   ❌  SupplierQuoteItem
 *   ❌  SupplierQuote
 *   ❌  InquiryStatusHistory
 *   ❌  InquirySupplier
 *   ❌  InquiryItem
 *   ❌  Inquiry
 *   ❌  StockMovement
 *   ❌  WarehouseStock
 *   ❌  InventoryItem
 *   ❌  Warehouse
 *   ❌  Attendance
 *   ❌  Document
 *   ❌  Notification
 *   ❌  AuditLog
 *   ❌  Message
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n🧹  Starting selective database clean-up...\n');

  const toDelete = [
    // ── Payments (child of Invoice) ─────────────────────────────────────────
    'payment',
    // ── Invoices ────────────────────────────────────────────────────────────
    'invoiceItem',
    'invoice',
    // ── Shipments ───────────────────────────────────────────────────────────
    'shipment',
    // ── Purchase Orders ──────────────────────────────────────────────────────
    'purchaseOrderItem',
    'purchaseOrder',
    // ── Quotations & Approval logs ───────────────────────────────────────────
    'approvalLog',
    'clientQuotationItem',
    'clientQuotation',
    'supplierQuoteItem',
    'supplierQuote',
    // ── Inquiries ────────────────────────────────────────────────────────────
    'inquiryStatusHistory',
    'inquirySupplier',
    'inquiryItem',
    'inquiry',
    // ── Inventory / Warehouse ────────────────────────────────────────────────
    'stockMovement',
    'warehouseStock',
    'inventoryItem',
    'warehouse',
    // ── HR (Attendance only – Employee row kept) ─────────────────────────────
    'attendance',
    // ── Misc ─────────────────────────────────────────────────────────────────
    'document',
    'notification',
    'auditLog',
    'message',
  ];

  for (const model of toDelete) {
    const result = await prisma[model].deleteMany({});
    console.log(`  ✓  ${model.padEnd(26)} — ${result.count} row(s) removed`);
  }

  console.log('\n✅  Done! The following tables were NOT touched:');
  console.log('    user, product, client, clientVessel, supplier, vehicle,');
  console.log('    employee, role, permission, rolePermission, bankAccount\n');
}

main()
  .catch((err) => {
    console.error('\n❌  Error during clean-up:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
