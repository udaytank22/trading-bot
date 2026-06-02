# TradeMind Database Architecture & Schema Creation Guide

This document details the database schema configuration, table definitions, raw SQL creation queries, and migration instructions to set up the backend database for the TradeMind Quotation Dashboard.

The database is built on **PostgreSQL** and orchestrated through **Prisma ORM**, but can also be created manually using standard SQL queries in tools like pgAdmin, DBeaver, or the `psql` command-line utility.

---

## 1. Quick Database Setup Options

Choose one of the two options below to set up your PostgreSQL database.

### Option A: Prisma ORM (Recommended)
Prisma will automatically create the tables, define relations, build indexes, and seed initial roles and permissions.

1. **Configure Environment Variables**
   Ensure your `.env` file in the backend root has the correct PostgreSQL connection string:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/trademind_db?schema=public"
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run Migrations**
   This executes the generated migration script which creates all tables, indexes, and constraints.
   ```bash
   npx prisma migrate dev --name init
   ```
   *Alternative:* To deploy the schema directly to a production database:
   ```bash
   npx prisma migrate deploy
   ```

4. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

5. **Seed the Database**
   Insert initial roles (Admin, Team Leader, User, Accountant) and default module permissions:
   ```bash
   npm run prisma:seed
   ```

---

### Option B: Manual SQL Execution
If you are setting up the database manually without Prisma, run the SQL queries described in Section 3 inside your SQL runner in the chronological order listed (ensuring parent tables are created before child tables containing foreign keys).

To initialize the database in one command, you can run:
```bash
psql -h localhost -U username -d trademind_db -f prisma/migrations/20260530071831_init/migration.sql
```

---

## 2. Schema Structure Overview

The 32 tables in the schema are categorized into the following modules:

1. **Auth & RBAC**: `User`, `Role`, `Permission`, `RolePermission`
2. **CRM Core**: `Client`, `Supplier`, `Product`
3. **Inquiry Pipeline**: `Inquiry`, `InquiryItem`, `InquirySupplier`, `InquiryStatusHistory`, `SupplierQuote`, `SupplierQuoteItem`, `ClientQuotation`, `ClientQuotationItem`, `ApprovalLog`
4. **Purchase Orders & Shipments**: `PurchaseOrder`, `PurchaseOrderItem`, `Shipment`
5. **Billing & Payments**: `Invoice`, `InvoiceItem`, `Payment`, `BankAccount`
6. **Inventory & Warehouse**: `InventoryItem`, `Warehouse`, `WarehouseStock`, `StockMovement`
7. **Employees & Attendance**: `Employee`, `Attendance`
8. **Documents & Notifications**: `Document`, `Notification`, `AuditLog`

---

## 3. Database Table Definitions and Creation Queries

### 3.1. Auth & RBAC Tables

#### Table: `Role`
Stores user roles (e.g. admin, team_leader, user, accountant).
* **Primary Key**: `id` (TEXT / UUID)
* **Unique Constraints**: `name`
* **SQL Creation Query**:
```sql
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");
```

#### Table: `Permission`
Stores system module actions (e.g., module: `inquiries`, action: `create`).
* **Primary Key**: `id` (TEXT / UUID)
* **Unique Constraints**: `(module, action)`
* **SQL Creation Query**:
```sql
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Permission_module_action_key" ON "Permission"("module", "action");
```

#### Table: `RolePermission`
Mapping table for Role-Permission associations (many-to-many link).
* **Primary Key**: `id` (TEXT / UUID)
* **Unique Constraints**: `(roleId, permissionId)`
* **Foreign Keys**:
  - `roleId` References `Role(id)` ON DELETE CASCADE
  - `permissionId` References `Permission(id)` ON DELETE CASCADE
* **SQL Creation Query**:
```sql
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" 
  FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" 
  FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

#### Table: `User`
Stores system accounts for employees.
* **Primary Key**: `id` (TEXT / UUID)
* **Unique Constraints**: `email`, `employeeProfileId`
* **Foreign Keys**:
  - `roleId` References `Role(id)` ON DELETE RESTRICT
  - `employeeProfileId` References `Employee(id)` ON DELETE SET NULL
* **SQL Creation Query**:
```sql
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "refreshToken" TEXT,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "employeeProfileId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_employeeProfileId_key" ON "User"("employeeProfileId");

ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" 
  FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "User" ADD CONSTRAINT "User_employeeProfileId_fkey" 
  FOREIGN KEY ("employeeProfileId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

---

### 3.2. Core CRM Tables

#### Table: `Client`
Stores client details.
* **Primary Key**: `id` (TEXT / UUID)
* **SQL Creation Query**:
```sql
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);
```

#### Table: `Supplier`
Stores supplier directory.
* **Primary Key**: `id` (TEXT / UUID)
* **SQL Creation Query**:
```sql
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);
```

#### Table: `Product`
Master catalog of sourced/supplied products.
* **Primary Key**: `id` (TEXT / UUID)
* **Unique Constraints**: `sku`
* **SQL Creation Query**:
```sql
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "category" TEXT,
    "unit" TEXT,
    "sellingPrice" DECIMAL(12,2) NOT NULL,
    "purchasePrice" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
```

---

### 3.3. Inquiry Pipeline Tables

#### Table: `Inquiry`
Represents an inquiry from a Client.
* **Primary Key**: `id` (TEXT / UUID)
* **Unique Constraints**: `inquiryNumber`
* **Foreign Keys**:
  - `clientId` References `Client(id)` ON DELETE RESTRICT
  - `assignedEmployeeId` References `User(id)` ON DELETE SET NULL
  - `assignedTeamLeadId` References `User(id)` ON DELETE SET NULL
  - `createdById` References `User(id)` ON DELETE SET NULL
  - `updatedById` References `User(id)` ON DELETE SET NULL
* **SQL Creation Query**:
```sql
CREATE TABLE "Inquiry" (
    "id" TEXT NOT NULL,
    "inquiryNumber" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "vesselName" TEXT,
    "referenceNumber" TEXT,
    "currentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "assignedEmployeeId" TEXT,
    "assignedTeamLeadId" TEXT,
    "expectedDeliveryDate" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Inquiry_inquiryNumber_key" ON "Inquiry"("inquiryNumber");

ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_clientId_fkey" 
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_assignedEmployeeId_fkey" 
  FOREIGN KEY ("assignedEmployeeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_assignedTeamLeadId_fkey" 
  FOREIGN KEY ("assignedTeamLeadId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_createdById_fkey" 
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_updatedById_fkey" 
  FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

#### Table: `InquiryItem`
Line items associated with an inquiry.
* **Primary Key**: `id` (TEXT / UUID)
* **Foreign Keys**:
  - `inquiryId` References `Inquiry(id)` ON DELETE CASCADE
  - `productId` References `Product(id)` ON DELETE SET NULL
* **SQL Creation Query**:
```sql
CREATE TABLE "InquiryItem" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "productId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InquiryItem_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "InquiryItem" ADD CONSTRAINT "InquiryItem_inquiryId_fkey" 
  FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InquiryItem" ADD CONSTRAINT "InquiryItem_productId_fkey" 
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

#### Table: `InquirySupplier`
Mapping of suppliers selected to receive RFQs for an inquiry.
* **Primary Key**: `id` (TEXT / UUID)
* **Foreign Keys**:
  - `inquiryId` References `Inquiry(id)` ON DELETE CASCADE
  - `supplierId` References `Supplier(id)` ON DELETE RESTRICT
* **SQL Creation Query**:
```sql
CREATE TABLE "InquirySupplier" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InquirySupplier_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "InquirySupplier" ADD CONSTRAINT "InquirySupplier_inquiryId_fkey" 
  FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InquirySupplier" ADD CONSTRAINT "InquirySupplier_supplierId_fkey" 
  FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

#### Table: `InquiryStatusHistory`
Logs transitions in status for auditing and tracking.
* **Primary Key**: `id` (TEXT / UUID)
* **Foreign Keys**:
  - `inquiryId` References `Inquiry(id)` ON DELETE CASCADE
  - `changedById` References `User(id)` ON DELETE RESTRICT
* **SQL Creation Query**:
```sql
CREATE TABLE "InquiryStatusHistory" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InquiryStatusHistory_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "InquiryStatusHistory" ADD CONSTRAINT "InquiryStatusHistory_inquiryId_fkey" 
  FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InquiryStatusHistory" ADD CONSTRAINT "InquiryStatusHistory_changedById_fkey" 
  FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

#### Table: `SupplierQuote`
Quotes received from suppliers.
* **Primary Key**: `id` (TEXT / UUID)
* **Foreign Keys**:
  - `supplierId` References `Supplier(id)` ON DELETE RESTRICT
  - `inquiryId` References `Inquiry(id)` ON DELETE CASCADE
* **SQL Creation Query**:
```sql
CREATE TABLE "SupplierQuote" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "quoteAmount" DECIMAL(12,2) NOT NULL,
    "taxAmount" DECIMAL(12,2) NOT NULL,
    "finalAmount" DECIMAL(12,2) NOT NULL,
    "validityDate" TIMESTAMP(3),
    "documentAttachment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SupplierQuote_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SupplierQuote" ADD CONSTRAINT "SupplierQuote_supplierId_fkey" 
  FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SupplierQuote" ADD CONSTRAINT "SupplierQuote_inquiryId_fkey" 
  FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

#### Table: `SupplierQuoteItem`
Line items in a supplier quote.
* **Primary Key**: `id` (TEXT / UUID)
* **Foreign Keys**:
  - `supplierQuoteId` References `SupplierQuote(id)` ON DELETE CASCADE
  - `inquiryItemId` References `InquiryItem(id)` ON DELETE RESTRICT
* **SQL Creation Query**:
```sql
CREATE TABLE "SupplierQuoteItem" (
    "id" TEXT NOT NULL,
    "supplierQuoteId" TEXT NOT NULL,
    "inquiryItemId" TEXT NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "totalPrice" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "SupplierQuoteItem_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SupplierQuoteItem" ADD CONSTRAINT "SupplierQuoteItem_supplierQuoteId_fkey" 
  FOREIGN KEY ("supplierQuoteId") REFERENCES "SupplierQuote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SupplierQuoteItem" ADD CONSTRAINT "SupplierQuoteItem_inquiryItemId_fkey" 
  FOREIGN KEY ("inquiryItemId") REFERENCES "InquiryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

#### Table: `ClientQuotation`
Quotations prepared and sent to the client.
* **Primary Key**: `id` (TEXT / UUID)
* **Unique Constraints**: `quotationNumber`
* **Foreign Keys**:
  - `inquiryId` References `Inquiry(id)` ON DELETE CASCADE
* **SQL Creation Query**:
```sql
CREATE TABLE "ClientQuotation" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "quotationNumber" TEXT NOT NULL,
    "marginPercentage" DECIMAL(5,2) NOT NULL,
    "discountPercentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "taxPercentage" DECIMAL(5,2) NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "finalAmount" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ClientQuotation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ClientQuotation_quotationNumber_key" ON "ClientQuotation"("quotationNumber");

ALTER TABLE "ClientQuotation" ADD CONSTRAINT "ClientQuotation_inquiryId_fkey" 
  FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

#### Table: `ClientQuotationItem`
Line items in a client quotation.
* **Primary Key**: `id` (TEXT / UUID)
* **Foreign Keys**:
  - `clientQuotationId` References `ClientQuotation(id)` ON DELETE CASCADE
  - `inquiryItemId` References `InquiryItem(id)` ON DELETE RESTRICT
* **SQL Creation Query**:
```sql
CREATE TABLE "ClientQuotationItem" (
    "id" TEXT NOT NULL,
    "clientQuotationId" TEXT NOT NULL,
    "inquiryItemId" TEXT NOT NULL,
    "sellingPrice" DECIMAL(12,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "totalPrice" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "ClientQuotationItem_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ClientQuotationItem" ADD CONSTRAINT "ClientQuotationItem_clientQuotationId_fkey" 
  FOREIGN KEY ("clientQuotationId") REFERENCES "ClientQuotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClientQuotationItem" ADD CONSTRAINT "ClientQuotationItem_inquiryItemId_fkey" 
  FOREIGN KEY ("inquiryItemId") REFERENCES "InquiryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

#### Table: `ApprovalLog`
Approval and rejection logs for inquiry lifecycle steps (TL, Admin).
* **Primary Key**: `id` (TEXT / UUID)
* **Foreign Keys**:
  - `inquiryId` References `Inquiry(id)` ON DELETE CASCADE
  - `approvedById` References `User(id)` ON DELETE RESTRICT
* **SQL Creation Query**:
```sql
CREATE TABLE "ApprovalLog" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "approvedById" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalLog_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ApprovalLog" ADD CONSTRAINT "ApprovalLog_inquiryId_fkey" 
  FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ApprovalLog" ADD CONSTRAINT "ApprovalLog_approvedById_fkey" 
  FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

---

### 3.4. Purchase Orders & Shipments

#### Table: `PurchaseOrder`
Orders dispatched to suppliers or clients.
* **Primary Key**: `id` (TEXT / UUID)
* **Unique Constraints**: `poNumber`
* **Foreign Keys**:
  - `supplierId` References `Supplier(id)` ON DELETE RESTRICT
  - `clientId` References `Client(id)` ON DELETE RESTRICT
  - `inquiryId` References `Inquiry(id)` ON DELETE SET NULL
* **SQL Creation Query**:
```sql
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "inquiryId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(12,2) NOT NULL,
    "expectedDeliveryDate" TIMESTAMP(3),
    "attachment" TEXT,
    "emailStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PurchaseOrder_poNumber_key" ON "PurchaseOrder"("poNumber");

ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_supplierId_fkey" 
  FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_clientId_fkey" 
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_inquiryId_fkey" 
  FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

#### Table: `PurchaseOrderItem`
Line items for purchase orders.
* **Primary Key**: `id` (TEXT / UUID)
* **Foreign Keys**:
  - `purchaseOrderId` References `PurchaseOrder(id)` ON DELETE CASCADE
  - `productId` References `Product(id)` ON DELETE RESTRICT
* **SQL Creation Query**:
```sql
CREATE TABLE "PurchaseOrderItem" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "totalPrice" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" 
  FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_productId_fkey" 
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

#### Table: `Shipment`
Tracks delivery status, logistics, loading dates, and vehicles.
* **Primary Key**: `id` (TEXT / UUID)
* **Unique Constraints**: `shipmentNumber`
* **Foreign Keys**:
  - `inquiryId` References `Inquiry(id)` ON DELETE SET NULL
  - `purchaseOrderId` References `PurchaseOrder(id)` ON DELETE SET NULL
  - `supplierId` References `Supplier(id)` ON DELETE RESTRICT
  - `clientId` References `Client(id)` ON DELETE RESTRICT
* **SQL Creation Query**:
```sql
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "shipmentNumber" TEXT NOT NULL,
    "inquiryId" TEXT,
    "purchaseOrderId" TEXT,
    "supplierId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "cargoDetails" TEXT,
    "vehicleDetails" TEXT,
    "driverDetails" TEXT,
    "loadingDate" TIMESTAMP(3),
    "deliveryDate" TIMESTAMP(3),
    "currentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "trackingRemarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Shipment_shipmentNumber_key" ON "Shipment"("shipmentNumber");

ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_inquiryId_fkey" 
  FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_purchaseOrderId_fkey" 
  FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_supplierId_fkey" 
  FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_clientId_fkey" 
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

---

### 3.5. Billing, Invoicing & Payments

#### Table: `Invoice`
Bills issued to clients.
* **Primary Key**: `id` (TEXT / UUID)
* **Unique Constraints**: `invoiceNumber`
* **Foreign Keys**:
  - `clientId` References `Client(id)` ON DELETE RESTRICT
  - `inquiryId` References `Inquiry(id)` ON DELETE SET NULL
  - `shipmentId` References `Shipment(id)` ON DELETE SET NULL
* **SQL Creation Query**:
```sql
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "inquiryId" TEXT,
    "shipmentId" TEXT,
    "invoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "subtotal" DECIMAL(12,2) NOT NULL,
    "tax" DECIMAL(12,2) NOT NULL,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "pendingAmount" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_clientId_fkey" 
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_inquiryId_fkey" 
  FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_shipmentId_fkey" 
  FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

#### Table: `InvoiceItem`
Line items within an Invoice.
* **Primary Key**: `id` (TEXT / UUID)
* **Foreign Keys**:
  - `invoiceId` References `Invoice(id)` ON DELETE CASCADE
* **SQL Creation Query**:
```sql
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "totalPrice" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" 
  FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

#### Table: `BankAccount`
Saves business bank accounts.
* **Primary Key**: `id` (TEXT / UUID)
* **Unique Constraints**: `accountNumber`
* **SQL Creation Query**:
```sql
CREATE TABLE "BankAccount" (
    "id" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountHolderName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "routingNumber" TEXT,
    "swiftCode" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "branch" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BankAccount_accountNumber_key" ON "BankAccount"("accountNumber");
```

#### Table: `Payment`
Tracks customer payments mapped to invoices.
* **Primary Key**: `id` (TEXT / UUID)
* **Foreign Keys**:
  - `invoiceId` References `Invoice(id)` ON DELETE RESTRICT
  - `bankAccountId` References `BankAccount(id)` ON DELETE RESTRICT
* **SQL Creation Query**:
```sql
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentMode" TEXT NOT NULL,
    "bankAccountId" TEXT NOT NULL,
    "transactionReference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" 
  FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bankAccountId_fkey" 
  FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

---

### 3.6. Inventory & Warehouse

#### Table: `InventoryItem`
Catalog items tracked in storage.
* **Primary Key**: `id` (TEXT / UUID)
* **Unique Constraints**: `sku`
* **SQL Creation Query**:
```sql
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "category" TEXT,
    "unit" TEXT,
    "sellingPrice" DECIMAL(12,2) NOT NULL,
    "purchasePrice" DECIMAL(12,2) NOT NULL,
    "minimumStockLevel" INTEGER NOT NULL DEFAULT 5,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "InventoryItem_sku_key" ON "InventoryItem"("sku");
```

#### Table: `Warehouse`
Locations/warehouses holding storage.
* **Primary Key**: `id` (TEXT / UUID)
* **SQL Creation Query**:
```sql
CREATE TABLE "Warehouse" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);
```

#### Table: `WarehouseStock`
Stocks of specific items at specific warehouses (junction mapping).
* **Primary Key**: `id` (TEXT / UUID)
* **Unique Constraints**: `(warehouseId, inventoryItemId)`
* **Foreign Keys**:
  - `warehouseId` References `Warehouse(id)` ON DELETE CASCADE
  - `inventoryItemId` References `InventoryItem(id)` ON DELETE CASCADE
* **SQL Creation Query**:
```sql
CREATE TABLE "WarehouseStock" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WarehouseStock_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "WarehouseStock_warehouseId_inventoryItemId_key" ON "WarehouseStock"("warehouseId", "inventoryItemId");

ALTER TABLE "WarehouseStock" ADD CONSTRAINT "WarehouseStock_warehouseId_fkey" 
  FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WarehouseStock" ADD CONSTRAINT "WarehouseStock_inventoryItemId_fkey" 
  FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

#### Table: `StockMovement`
Audit trail of stock movements (IN, OUT, ADJUSTMENT, RESERVED, RELEASED).
* **Primary Key**: `id` (TEXT / UUID)
* **Foreign Keys**:
  - `inventoryItemId` References `InventoryItem(id)` ON DELETE CASCADE
  - `warehouseId` References `Warehouse(id)` ON DELETE CASCADE
* **SQL Creation Query**:
```sql
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_inventoryItemId_fkey" 
  FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_warehouseId_fkey" 
  FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

---

### 3.7. Employees & Attendance

#### Table: `Employee`
Details of employees.
* **Primary Key**: `id` (TEXT / UUID)
* **Unique Constraints**: `email`
* **SQL Creation Query**:
```sql
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "department" TEXT,
    "designation" TEXT,
    "roleId" TEXT,
    "salary" DECIMAL(12,2),
    "joiningDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");
```

#### Table: `Attendance`
Attendance record for employees.
* **Primary Key**: `id` (TEXT / UUID)
* **Unique Constraints**: `(employeeId, date)`
* **Foreign Keys**:
  - `employeeId` References `Employee(id)` ON DELETE CASCADE
* **SQL Creation Query**:
```sql
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" TEXT NOT NULL,
    "checkInTime" TIMESTAMP(3),
    "checkOutTime" TIMESTAMP(3),
    "remarks" TEXT,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Attendance_employeeId_date_key" ON "Attendance"("employeeId", "date");

ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_employeeId_fkey" 
  FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

---

### 3.8. Documents, Notifications & Auditing

#### Table: `Document`
Uploaded documents (Visas, Licenses, Invoices, Contracts, etc.) and file paths.
* **Primary Key**: `id` (TEXT / UUID)
* **Foreign Keys**:
  - `uploadedById` References `User(id)` ON DELETE RESTRICT
  - `employeeId` References `Employee(id)` ON DELETE SET NULL
* **SQL Creation Query**:
```sql
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'VALID',
    "filePath" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "employeeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedById_fkey" 
  FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Document" ADD CONSTRAINT "Document_employeeId_fkey" 
  FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

#### Table: `Notification`
Notifications sent to individual users.
* **Primary Key**: `id` (TEXT / UUID)
* **Foreign Keys**:
  - `userId` References `User(id)` ON DELETE CASCADE
* **SQL Creation Query**:
```sql
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "relatedModule" TEXT,
    "relatedRecordId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

#### Table: `AuditLog`
System action logs for security auditing.
* **Primary Key**: `id` (TEXT / UUID)
* **Foreign Keys**:
  - `userId` References `User(id)` ON DELETE SET NULL
* **SQL Creation Query**:
```sql
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "recordId" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```
