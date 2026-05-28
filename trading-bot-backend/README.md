# Trading ERP & Bot Backend

This is the modular, scalable backend for the Trading ERP / Trading Bot system, built using **Node.js, Express.js, PostgreSQL, and Prisma ORM**.

---

## 📂 Folder Structure

The project follows a modular architecture where each domain area has its own folder containing a controller, service, routes, and validation file:

```
src/
├── config/                  # Server and Database Configurations
├── middleware/              # Global Express middlewares (Auth, RBAC, Validation, Error)
├── prisma/                  # Re-exports Prisma client instantiator
├── utils/                   # General utility helpers (Token, Response, Async wrapper, Query parser)
├── modules/                 # Module folder containing Domain Areas
│   ├── auth/                # Login, refresh tokens, change password
│   ├── users/               # User profiles CRUD
│   ├── roles/               # Role management
│   ├── permissions/         # Available action permissions list
│   ├── clients/             # CRM Client profiles
│   ├── suppliers/           # CRM Supplier profiles
│   ├── products/            # Catalog Products master list
│   ├── inquiries/           # Workflow Inquiry Pipeline & Action-based APIs
│   ├── quotations/          # Client Quotations tracking
│   ├── purchaseOrders/      # Procurement PO records
│   ├── shipments/           # Supply Chain cargo shipment tracking
│   ├── invoices/            # Billing invoices management
│   ├── payments/            # Financial payment collections ledger
│   ├── inventory/           # Stock inventory and movement ledger
│   ├── employees/           # Staff register and calendar attendance
│   ├── bankAccounts/        # SWIFT bank profiles
│   ├── documents/           # Compliance Kanban documents
│   ├── notifications/       # User alerts feed
│   ├── reports/             # Executive dashboard & audit aggregation reports
│   └── auditLogs/           # System history logs
└── server.js                # App entry point
```

---

## ⚙️ Setup and Installation

### 1. Prerequisites
- **Node.js** (v18+)
- **PostgreSQL** database running locally or remotely

### 2. Install Dependencies
Run the following command in the project root folder:
```bash
npm install
```

### 3. Database Configuration
1. Create a `.env` file in the root directory (based on `.env.example`).
2. Update the `DATABASE_URL` with your PostgreSQL credentials:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/db_name?schema=public"
```

### 4. Run Prisma Migrations
To build the database tables in PostgreSQL, execute the Prisma migration runner:
```bash
npx prisma migrate dev --name init
```
This generates the Prisma Client and constructs the tables in your PostgreSQL database.

### 5. Seed the Database
To populate the database with default roles, permissions, administrative credentials, and mockup inventory/partners data:
```bash
npx prisma db seed
```

### 6. Run the Server
- **Development Mode** (with automatic refresh on changes):
```bash
npm run dev
```
- **Production Mode**:
```bash
npm start
```

The server will spin up on **http://localhost:5000**.

---

## 🔑 Default Login Credentials

All seed users have the default password: **`admin123`**

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `superadmin@trademind.com` | `admin123` |
| **Admin** | `admin@trademind.com` | `admin123` |
| **Team Lead** | `teamlead@trademind.com` | `admin123` |
| **Employee** | `employee@trademind.com` | `admin123` |

---

## 🔄 Action-Based Inquiry Pipeline

Inquiries are protected by a state-safety validation layer. Standard status fields cannot be modified through normal `PUT`/`PATCH` calls. Instead, status transitions must occur sequentially using action-based endpoints:

1. **Stock Verification**: `POST /api/inquiries/:id/stock-check` (PENDING → RFQ_READY)
2. **Dispatch RFQ to Suppliers**: `POST /api/inquiries/:id/send-rfq` (RFQ_READY → RFQ_SENT)
3. **Save Supplier Quotation**: `POST /api/inquiries/:id/supplier-quote` (RFQ_SENT → CLIENT_QUOTING)
4. **Build Client Pricing**: `POST /api/inquiries/:id/client-quote` (CLIENT_QUOTING → TL_REVIEW)
5. **Team Lead Approval**: `POST /api/inquiries/:id/team-lead-approve` (TL_REVIEW → ADMIN_APPROVAL / REJECTED)
6. **Admin Verification**: `POST /api/inquiries/:id/admin-approve` (ADMIN_APPROVAL → EMPLOYEE_VERIFY / REJECTED)
7. **Final Employee Signoff**: `POST /api/inquiries/:id/final-verify` (EMPLOYEE_VERIFY → CLIENT_FINAL_APPROVAL)
8. **Client Acceptance**: `POST /api/inquiries/:id/client-decision` (CLIENT_FINAL_APPROVAL → QUOTE_SENT / CLOSED)
9. **Confirm Deal**: `POST /api/inquiries/:id/confirm-deal` (QUOTE_SENT → CONFIRMED)
   - *Note: Confirmed deal action automatically spawns the purchase order (PO) and shipment supply line in PENDING status.*
10. **Close Inquiry**: `POST /api/inquiries/:id/close` (CONFIRMED → CLOSED)

---

## 📊 Summary of Main Endpoints

All endpoints (except auth login/refresh) require `Authorization: Bearer <access_token>` headers.

| Endpoint | Method | Role Permission Required | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/login` | `POST` | Public | Credentials verify and JWT tokens issuance |
| `/api/auth/refresh` | `POST` | Public | Refresh token rotation |
| `/api/auth/change-password` | `POST` | Authenticated | Change password |
| `/api/users` | `GET`/`POST`/`PUT`/`DELETE` | `settings` permission | Manage admin users registry |
| `/api/roles` | `GET`/`POST`/`PUT`/`DELETE` | `settings` permission | Manage role definitions & permission grid |
| `/api/inquiries` | `GET`/`POST`/`PUT`/`DELETE` | `inquiries` permission | Inquiry CRUD and Pipeline Actions |
| `/api/purchase-orders` | `GET`/`POST`/`PUT`/`DELETE` | `purchaseOrders` permission | Procurement PO trackers |
| `/api/shipments` | `GET`/`POST`/`PUT`/`DELETE` | `shipments` permission | Supply chain shipments and transport allotment |
| `/api/invoices` | `GET`/`POST`/`PUT`/`DELETE` | `invoices` permission | Invoices billing and dispatch |
| `/api/payments` | `GET`/`POST`/`DELETE` | `payments` permission | Reconciled payment ledgers |
| `/api/inventory` | `GET`/`POST`/`PUT`/`DELETE` | `inventory` permission | Inventory catalog CRUD |
| `/api/inventory/movements` | `POST` | `inventory:update` | Post IN/OUT/ADJUSTMENT movements ledger |
| `/api/employees` | `GET`/`POST`/`PUT`/`DELETE` | `employees` | Staff management |
| `/api/employees/:id/attendance` | `POST` | `employees:update` | Post day attendance cards |
| `/api/bank-accounts` | `GET`/`POST`/`PUT`/`DELETE` | `bankAccounts` | Manage company bank profiles |
| `/api/documents` | `GET`/`POST`/`PUT`/`DELETE` | `documents` | Compliance docs registry |
| `/api/reports/dashboard` | `GET` | `dashboard:read` | Executive dashboard stats feed |
| `/api/reports/profit` | `GET` | `reports:read` | Profit margins audit log report |
