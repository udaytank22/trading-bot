-- CreateIndex
CREATE INDEX CONCURRENTLY "ApprovalLog_inquiryId_idx" ON "ApprovalLog"("inquiryId");

-- CreateIndex
CREATE INDEX CONCURRENTLY "ApprovalLog_approvedById_idx" ON "ApprovalLog"("approvedById");

-- CreateIndex
CREATE INDEX CONCURRENTLY "ApprovalLog_createdAt_idx" ON "ApprovalLog"("createdAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Attendance_status_idx" ON "Attendance"("status");

-- CreateIndex
CREATE INDEX CONCURRENTLY "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX CONCURRENTLY "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "BankAccount_createdById_idx" ON "BankAccount"("createdById");

-- CreateIndex
CREATE INDEX CONCURRENTLY "BankAccount_updatedById_idx" ON "BankAccount"("updatedById");

-- CreateIndex
CREATE INDEX CONCURRENTLY "BankAccount_status_idx" ON "BankAccount"("status");

-- CreateIndex
CREATE INDEX CONCURRENTLY "BankAccount_createdAt_idx" ON "BankAccount"("createdAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "BankAccount_deletedAt_idx" ON "BankAccount"("deletedAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Client_createdById_idx" ON "Client"("createdById");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Client_updatedById_idx" ON "Client"("updatedById");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Client_createdAt_idx" ON "Client"("createdAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Client_deletedAt_idx" ON "Client"("deletedAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "ClientQuotation_inquiryId_idx" ON "ClientQuotation"("inquiryId");

-- CreateIndex
CREATE INDEX CONCURRENTLY "ClientQuotation_createdById_idx" ON "ClientQuotation"("createdById");

-- CreateIndex
CREATE INDEX CONCURRENTLY "ClientQuotation_updatedById_idx" ON "ClientQuotation"("updatedById");

-- CreateIndex
CREATE INDEX CONCURRENTLY "ClientQuotation_status_idx" ON "ClientQuotation"("status");

-- CreateIndex
CREATE INDEX CONCURRENTLY "ClientQuotation_createdAt_idx" ON "ClientQuotation"("createdAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "ClientQuotation_deletedAt_idx" ON "ClientQuotation"("deletedAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "ClientQuotationItem_clientQuotationId_idx" ON "ClientQuotationItem"("clientQuotationId");

-- CreateIndex
CREATE INDEX CONCURRENTLY "ClientQuotationItem_inquiryItemId_idx" ON "ClientQuotationItem"("inquiryItemId");

-- CreateIndex
CREATE INDEX CONCURRENTLY "ClientVessel_clientId_idx" ON "ClientVessel"("clientId");

-- CreateIndex
CREATE INDEX CONCURRENTLY "ClientVessel_createdAt_idx" ON "ClientVessel"("createdAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Document_entityId_idx" ON "Document"("entityId");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Document_uploadedById_idx" ON "Document"("uploadedById");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Document_employeeId_idx" ON "Document"("employeeId");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Document_createdById_idx" ON "Document"("createdById");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Document_updatedById_idx" ON "Document"("updatedById");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Document_status_idx" ON "Document"("status");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Document_createdAt_idx" ON "Document"("createdAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Document_deletedAt_idx" ON "Document"("deletedAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Employee_roleId_idx" ON "Employee"("roleId");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Employee_createdById_idx" ON "Employee"("createdById");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Employee_updatedById_idx" ON "Employee"("updatedById");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Employee_status_idx" ON "Employee"("status");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Employee_createdAt_idx" ON "Employee"("createdAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Employee_deletedAt_idx" ON "Employee"("deletedAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Inquiry_clientId_idx" ON "Inquiry"("clientId");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Inquiry_assignedEmployeeId_idx" ON "Inquiry"("assignedEmployeeId");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Inquiry_assignedTeamLeadId_idx" ON "Inquiry"("assignedTeamLeadId");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Inquiry_createdById_idx" ON "Inquiry"("createdById");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Inquiry_updatedById_idx" ON "Inquiry"("updatedById");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Inquiry_currentStatus_idx" ON "Inquiry"("currentStatus");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Inquiry_createdAt_idx" ON "Inquiry"("createdAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Inquiry_deletedAt_idx" ON "Inquiry"("deletedAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "InquiryItem_inquiryId_idx" ON "InquiryItem"("inquiryId");

-- CreateIndex
CREATE INDEX CONCURRENTLY "InquiryItem_productId_idx" ON "InquiryItem"("productId");

-- CreateIndex
CREATE INDEX CONCURRENTLY "InquiryItem_createdAt_idx" ON "InquiryItem"("createdAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "InquiryStatusHistory_inquiryId_idx" ON "InquiryStatusHistory"("inquiryId");

-- CreateIndex
CREATE INDEX CONCURRENTLY "InquiryStatusHistory_changedById_idx" ON "InquiryStatusHistory"("changedById");

-- CreateIndex
CREATE INDEX CONCURRENTLY "InquiryStatusHistory_createdAt_idx" ON "InquiryStatusHistory"("createdAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "InquirySupplier_inquiryId_idx" ON "InquirySupplier"("inquiryId");

-- CreateIndex
CREATE INDEX CONCURRENTLY "InquirySupplier_supplierId_idx" ON "InquirySupplier"("supplierId");

-- CreateIndex
CREATE INDEX CONCURRENTLY "InquirySupplier_createdAt_idx" ON "InquirySupplier"("createdAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "InventoryItem_createdById_idx" ON "InventoryItem"("createdById");

-- CreateIndex
CREATE INDEX CONCURRENTLY "InventoryItem_updatedById_idx" ON "InventoryItem"("updatedById");

-- CreateIndex
CREATE INDEX CONCURRENTLY "InventoryItem_status_idx" ON "InventoryItem"("status");

-- CreateIndex
CREATE INDEX CONCURRENTLY "InventoryItem_createdAt_idx" ON "InventoryItem"("createdAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "InventoryItem_deletedAt_idx" ON "InventoryItem"("deletedAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Message_receiverId_idx" ON "Message"("receiverId");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Payment_bankAccountId_idx" ON "Payment"("bankAccountId");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Payment_createdById_idx" ON "Payment"("createdById");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Payment_updatedById_idx" ON "Payment"("updatedById");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Payment_createdAt_idx" ON "Payment"("createdAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Payment_deletedAt_idx" ON "Payment"("deletedAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Permission_createdAt_idx" ON "Permission"("createdAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Product_createdById_idx" ON "Product"("createdById");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Product_updatedById_idx" ON "Product"("updatedById");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Product_createdAt_idx" ON "Product"("createdAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Product_deletedAt_idx" ON "Product"("deletedAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "PurchaseOrder_supplierId_idx" ON "PurchaseOrder"("supplierId");

-- CreateIndex
CREATE INDEX CONCURRENTLY "PurchaseOrder_clientId_idx" ON "PurchaseOrder"("clientId");

-- CreateIndex
CREATE INDEX CONCURRENTLY "PurchaseOrder_inquiryId_idx" ON "PurchaseOrder"("inquiryId");

-- CreateIndex
CREATE INDEX CONCURRENTLY "PurchaseOrder_createdById_idx" ON "PurchaseOrder"("createdById");

-- CreateIndex
CREATE INDEX CONCURRENTLY "PurchaseOrder_updatedById_idx" ON "PurchaseOrder"("updatedById");

-- CreateIndex
CREATE INDEX CONCURRENTLY "PurchaseOrder_status_idx" ON "PurchaseOrder"("status");

-- CreateIndex
CREATE INDEX CONCURRENTLY "PurchaseOrder_createdAt_idx" ON "PurchaseOrder"("createdAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "PurchaseOrder_deletedAt_idx" ON "PurchaseOrder"("deletedAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "PurchaseOrderItem_purchaseOrderId_idx" ON "PurchaseOrderItem"("purchaseOrderId");

-- CreateIndex
CREATE INDEX CONCURRENTLY "PurchaseOrderItem_productId_idx" ON "PurchaseOrderItem"("productId");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Role_createdAt_idx" ON "Role"("createdAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Role_deletedAt_idx" ON "Role"("deletedAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

-- CreateIndex
CREATE INDEX CONCURRENTLY "StockMovement_inventoryItemId_idx" ON "StockMovement"("inventoryItemId");

-- CreateIndex
CREATE INDEX CONCURRENTLY "StockMovement_warehouseId_idx" ON "StockMovement"("warehouseId");

-- CreateIndex
CREATE INDEX CONCURRENTLY "StockMovement_createdById_idx" ON "StockMovement"("createdById");

-- CreateIndex
CREATE INDEX CONCURRENTLY "StockMovement_updatedById_idx" ON "StockMovement"("updatedById");

-- CreateIndex
CREATE INDEX CONCURRENTLY "StockMovement_createdAt_idx" ON "StockMovement"("createdAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "StockMovement_deletedAt_idx" ON "StockMovement"("deletedAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Supplier_createdById_idx" ON "Supplier"("createdById");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Supplier_updatedById_idx" ON "Supplier"("updatedById");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Supplier_createdAt_idx" ON "Supplier"("createdAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Supplier_deletedAt_idx" ON "Supplier"("deletedAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "SupplierQuote_supplierId_idx" ON "SupplierQuote"("supplierId");

-- CreateIndex
CREATE INDEX CONCURRENTLY "SupplierQuote_inquiryId_idx" ON "SupplierQuote"("inquiryId");

-- CreateIndex
CREATE INDEX CONCURRENTLY "SupplierQuote_createdById_idx" ON "SupplierQuote"("createdById");

-- CreateIndex
CREATE INDEX CONCURRENTLY "SupplierQuote_updatedById_idx" ON "SupplierQuote"("updatedById");

-- CreateIndex
CREATE INDEX CONCURRENTLY "SupplierQuote_createdAt_idx" ON "SupplierQuote"("createdAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "SupplierQuote_deletedAt_idx" ON "SupplierQuote"("deletedAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "SupplierQuoteItem_supplierQuoteId_idx" ON "SupplierQuoteItem"("supplierQuoteId");

-- CreateIndex
CREATE INDEX CONCURRENTLY "SupplierQuoteItem_inquiryItemId_idx" ON "SupplierQuoteItem"("inquiryItemId");

-- CreateIndex
CREATE INDEX CONCURRENTLY "User_roleId_idx" ON "User"("roleId");

-- CreateIndex
CREATE INDEX CONCURRENTLY "User_createdById_idx" ON "User"("createdById");

-- CreateIndex
CREATE INDEX CONCURRENTLY "User_updatedById_idx" ON "User"("updatedById");

-- CreateIndex
CREATE INDEX CONCURRENTLY "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Vehicle_status_idx" ON "Vehicle"("status");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Vehicle_createdAt_idx" ON "Vehicle"("createdAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Vehicle_deletedAt_idx" ON "Vehicle"("deletedAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Warehouse_createdById_idx" ON "Warehouse"("createdById");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Warehouse_updatedById_idx" ON "Warehouse"("updatedById");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Warehouse_createdAt_idx" ON "Warehouse"("createdAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Warehouse_deletedAt_idx" ON "Warehouse"("deletedAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "WarehouseStock_inventoryItemId_idx" ON "WarehouseStock"("inventoryItemId");

