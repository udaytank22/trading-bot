const fs = require('fs');

const schemaPath = 'c:/Users/HP/Desktop/trading-bot/trading-bot-backend/prisma/schema.prisma';
let schema = fs.readFileSync(schemaPath, 'utf8');

// Normalize line endings to \n for matching, then we can write back as \n
schema = schema.replace(/\r\n/g, '\n');

const modifications = [
  { target: '  receivedMessages      Message[]              @relation("ReceivedMessages")\n}', replacement: '  receivedMessages      Message[]              @relation("ReceivedMessages")\n\n  @@index([roleId])\n  @@index([createdById])\n  @@index([updatedById])\n  @@index([createdAt])\n  @@index([deletedAt])\n}' },
  { target: '  users       User[]\n}', replacement: '  users       User[]\n\n  @@index([createdAt])\n  @@index([deletedAt])\n}' },
  { target: '  @@unique([module, action])\n}', replacement: '  @@unique([module, action])\n  @@index([createdAt])\n}' },
  { target: '  @@unique([roleId, permissionId])\n}', replacement: '  @@unique([roleId, permissionId])\n  @@index([permissionId])\n}' },
  { target: '  shipments      Shipment[]\n}', replacement: '  shipments      Shipment[]\n\n  @@index([createdById])\n  @@index([updatedById])\n  @@index([createdAt])\n  @@index([deletedAt])\n}' },
  { target: '  client    Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)\n}', replacement: '  client    Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)\n\n  @@index([clientId])\n  @@index([createdAt])\n}' },
  { target: '  supplierQuotes SupplierQuote[]\n}', replacement: '  supplierQuotes SupplierQuote[]\n\n  @@index([createdById])\n  @@index([updatedById])\n  @@index([createdAt])\n  @@index([deletedAt])\n}' },
  { target: '  purchaseOrderItems PurchaseOrderItem[]\n}', replacement: '  purchaseOrderItems PurchaseOrderItem[]\n\n  @@index([createdById])\n  @@index([updatedById])\n  @@index([createdAt])\n  @@index([deletedAt])\n}' },
  { target: '  supplierQuotes       SupplierQuote[]\n}', replacement: '  supplierQuotes       SupplierQuote[]\n\n  @@index([clientId])\n  @@index([assignedEmployeeId])\n  @@index([assignedTeamLeadId])\n  @@index([createdById])\n  @@index([updatedById])\n  @@index([currentStatus])\n  @@index([createdAt])\n  @@index([deletedAt])\n}' },
  { target: '  supplierQuoteItems   SupplierQuoteItem[]\n}', replacement: '  supplierQuoteItems   SupplierQuoteItem[]\n\n  @@index([inquiryId])\n  @@index([productId])\n  @@index([createdAt])\n}' },
  { target: '  supplier   Supplier @relation(fields: [supplierId], references: [id])\n}', replacement: '  supplier   Supplier @relation(fields: [supplierId], references: [id])\n\n  @@index([inquiryId])\n  @@index([supplierId])\n  @@index([createdAt])\n}' },
  { target: '  inquiry     Inquiry  @relation(fields: [inquiryId], references: [id], onDelete: Cascade)\n}', replacement: '  inquiry     Inquiry  @relation(fields: [inquiryId], references: [id], onDelete: Cascade)\n\n  @@index([inquiryId])\n  @@index([changedById])\n  @@index([createdAt])\n}' },
  { target: '  items              SupplierQuoteItem[]\n}', replacement: '  items              SupplierQuoteItem[]\n\n  @@index([supplierId])\n  @@index([inquiryId])\n  @@index([createdById])\n  @@index([updatedById])\n  @@index([createdAt])\n  @@index([deletedAt])\n}' },
  { target: '  supplierQuote   SupplierQuote @relation(fields: [supplierQuoteId], references: [id], onDelete: Cascade)\n}', replacement: '  supplierQuote   SupplierQuote @relation(fields: [supplierQuoteId], references: [id], onDelete: Cascade)\n\n  @@index([supplierQuoteId])\n  @@index([inquiryItemId])\n}' },
  { target: '  items              ClientQuotationItem[]\n}', replacement: '  items              ClientQuotationItem[]\n\n  @@index([inquiryId])\n  @@index([createdById])\n  @@index([updatedById])\n  @@index([status])\n  @@index([createdAt])\n  @@index([deletedAt])\n}' },
  { target: '  inquiryItem       InquiryItem     @relation(fields: [inquiryItemId], references: [id])\n}', replacement: '  inquiryItem       InquiryItem     @relation(fields: [inquiryItemId], references: [id])\n\n  @@index([clientQuotationId])\n  @@index([inquiryItemId])\n}' },
  { target: '  inquiry      Inquiry  @relation(fields: [inquiryId], references: [id], onDelete: Cascade)\n}', replacement: '  inquiry      Inquiry  @relation(fields: [inquiryId], references: [id], onDelete: Cascade)\n\n  @@index([inquiryId])\n  @@index([approvedById])\n  @@index([createdAt])\n}' },
  { target: '  shipments            Shipment[]\n}', replacement: '  shipments            Shipment[]\n\n  @@index([supplierId])\n  @@index([clientId])\n  @@index([inquiryId])\n  @@index([createdById])\n  @@index([updatedById])\n  @@index([status])\n  @@index([createdAt])\n  @@index([deletedAt])\n}' },
  { target: '  purchaseOrder   PurchaseOrder @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)\n}', replacement: '  purchaseOrder   PurchaseOrder @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)\n\n  @@index([purchaseOrderId])\n  @@index([productId])\n}' },
  { target: '  supplier        Supplier?      @relation(fields: [supplierId], references: [id])\n}', replacement: '  supplier        Supplier?      @relation(fields: [supplierId], references: [id])\n\n  @@index([inquiryId])\n  @@index([purchaseOrderId])\n  @@index([supplierId])\n  @@index([clientId])\n  @@index([createdById])\n  @@index([updatedById])\n  @@index([currentStatus])\n  @@index([createdAt])\n  @@index([deletedAt])\n}' },
  { target: '  payments      Payment[]\n}', replacement: '  payments      Payment[]\n\n  @@index([clientId])\n  @@index([inquiryId])\n  @@index([shipmentId])\n  @@index([createdById])\n  @@index([updatedById])\n  @@index([status])\n  @@index([createdAt])\n  @@index([deletedAt])\n}' },
  { target: '  invoice     Invoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)\n}', replacement: '  invoice     Invoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)\n\n  @@index([invoiceId])\n}' },
  { target: '  invoice              Invoice     @relation(fields: [invoiceId], references: [id])\n}', replacement: '  invoice              Invoice     @relation(fields: [invoiceId], references: [id])\n\n  @@index([invoiceId])\n  @@index([bankAccountId])\n  @@index([createdById])\n  @@index([updatedById])\n  @@index([createdAt])\n  @@index([deletedAt])\n}' },
  { target: '  stocks            WarehouseStock[]\n}', replacement: '  stocks            WarehouseStock[]\n\n  @@index([createdById])\n  @@index([updatedById])\n  @@index([status])\n  @@index([createdAt])\n  @@index([deletedAt])\n}' },
  { target: '  stocks         WarehouseStock[]\n}', replacement: '  stocks         WarehouseStock[]\n\n  @@index([createdById])\n  @@index([updatedById])\n  @@index([createdAt])\n  @@index([deletedAt])\n}' },
  { target: '  @@unique([warehouseId, inventoryItemId])\n}', replacement: '  @@unique([warehouseId, inventoryItemId])\n  @@index([inventoryItemId])\n}' },
  { target: '  warehouse         Warehouse     @relation(fields: [warehouseId], references: [id], onDelete: Cascade)\n}', replacement: '  warehouse         Warehouse     @relation(fields: [warehouseId], references: [id], onDelete: Cascade)\n\n  @@index([inventoryItemId])\n  @@index([warehouseId])\n  @@index([createdById])\n  @@index([updatedById])\n  @@index([createdAt])\n  @@index([deletedAt])\n}' },
  { target: '  user        User?\n}', replacement: '  user        User?\n\n  @@index([roleId])\n  @@index([createdById])\n  @@index([updatedById])\n  @@index([status])\n  @@index([createdAt])\n  @@index([deletedAt])\n}' },
  { target: '  @@unique([employeeId, date])\n}', replacement: '  @@unique([employeeId, date])\n  @@index([status])\n}' },
  { target: '  payments          Payment[]\n}', replacement: '  payments          Payment[]\n\n  @@index([createdById])\n  @@index([updatedById])\n  @@index([status])\n  @@index([createdAt])\n  @@index([deletedAt])\n}' },
  { target: '  uploadedBy   User      @relation("DocumentUploader", fields: [uploadedById], references: [id])\n}', replacement: '  uploadedBy   User      @relation("DocumentUploader", fields: [uploadedById], references: [id])\n\n  @@index([entityId])\n  @@index([uploadedById])\n  @@index([employeeId])\n  @@index([createdById])\n  @@index([updatedById])\n  @@index([status])\n  @@index([createdAt])\n  @@index([deletedAt])\n}' },
  { target: '  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n}', replacement: '  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@index([userId])\n  @@index([createdAt])\n}' },
  { target: '  user      User?    @relation(fields: [userId], references: [id])\n}', replacement: '  user      User?    @relation(fields: [userId], references: [id])\n\n  @@index([userId])\n  @@index([createdAt])\n}' },
  { target: '  deletedAt   DateTime?\n}', replacement: '  deletedAt   DateTime?\n\n  @@index([status])\n  @@index([createdAt])\n  @@index([deletedAt])\n}' },
  { target: '  receiver User @relation("ReceivedMessages", fields: [receiverId], references: [id])\n}', replacement: '  receiver User @relation("ReceivedMessages", fields: [receiverId], references: [id])\n\n  @@index([senderId])\n  @@index([receiverId])\n  @@index([createdAt])\n}' }
];

for (const mod of modifications) {
  schema = schema.replace(mod.target, mod.replacement);
}

fs.writeFileSync(schemaPath, schema);
console.log("Updated schema.prisma successfully.");
