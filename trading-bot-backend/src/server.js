const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const errorHandler = require('./middleware/error.middleware');
const { sendError } = require('./utils/response');

const app = express();

// Security and middleware setup
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Server check endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Trading ERP and Trading Bot Backend REST API',
    version: '1.0.0'
  });
});

// Module routes
app.use('/api/auth', require('./modules/auth/auth.routes'));
app.use('/api/users', require('./modules/users/users.routes'));
app.use('/api/roles', require('./modules/roles/roles.routes'));
app.use('/api/permissions', require('./modules/permissions/permissions.routes'));
app.use('/api/clients', require('./modules/clients/clients.routes'));
app.use('/api/suppliers', require('./modules/suppliers/suppliers.routes'));
app.use('/api/products', require('./modules/products/products.routes'));
app.use('/api/inquiries', require('./modules/inquiries/inquiries.routes'));
app.use('/api/quotations', require('./modules/quotations/quotations.routes'));
app.use('/api/purchase-orders', require('./modules/purchaseOrders/purchaseOrders.routes'));
app.use('/api/shipments', require('./modules/shipments/shipments.routes'));
app.use('/api/invoices', require('./modules/invoices/invoices.routes'));
app.use('/api/payments', require('./modules/payments/payments.routes'));
app.use('/api/inventory', require('./modules/inventory/inventory.routes'));
app.use('/api/employees', require('./modules/employees/employees.routes'));
app.use('/api/bank-accounts', require('./modules/bankAccounts/bankAccounts.routes'));
app.use('/api/documents', require('./modules/documents/documents.routes'));
app.use('/api/notifications', require('./modules/notifications/notifications.routes'));
app.use('/api/reports', require('./modules/reports/reports.routes'));
app.use('/api/audit-logs', require('./modules/auditLogs/auditLogs.routes'));

// Catch-all route not found handler
app.use((req, res, next) => {
  return sendError(res, `API route not found: [${req.method}] ${req.originalUrl}`, [], 404);
});

// Global central error handler
app.use(errorHandler);

const server = app.listen(config.PORT, () => {
  console.log(`[Server] running in ${config.NODE_ENV} mode on port ${config.PORT}`);
});

module.exports = server;
