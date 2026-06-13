const fs = require('fs');
const path = require('path');

const files = [
  'web/src/context/SocketContext.jsx',
  'web/src/features/accounts/AccountPage.jsx',
  'web/src/features/accounts/modals/AddAccountModal.jsx',
  'web/src/features/client-portal/ClientRFQsPage.jsx',
  'web/src/features/documents/DocumentsPage.jsx',
  'web/src/features/documents/modals/AddDocumentModal.jsx',
  'web/src/features/employees/EmployeesPage.jsx',
  'web/src/features/employees/modals/AddEmployeeModal.jsx',
  'web/src/features/inquiries/InquiriesPage.jsx',
  'web/src/features/inquiries/InquiryDetailsPage.jsx',
  'web/src/features/inquiries/modals/AddInquiryModal.jsx',
  'web/src/features/inquiries/modals/QuoteModal.jsx',
  'web/src/features/invoices/InvoiceDetailsPage.jsx',
  'web/src/features/invoices/modals/PaymentModal.jsx',
  'web/src/features/purchase-orders/modals/AddPurchaseOrderModal.jsx',
  'web/src/features/purchase-orders/PODetailsPage.jsx',
  'web/src/features/purchase-orders/PurchaseOrdersPage.jsx',
  'web/src/features/settings/components/ClientsTab.jsx',
  'web/src/features/settings/components/GeneralSettingsTab.jsx',
  'web/src/features/settings/components/ProductsTab.jsx',
  'web/src/features/settings/components/RolePermissionsTab.jsx',
  'web/src/features/settings/components/VehiclesTab.jsx',
  'web/src/features/settings/components/VendorsTab.jsx',
  'web/src/features/supply/modals/AddSupplyModal.jsx',
  'web/src/features/supply/SupplyDetailsPage.jsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (line.includes('showToast(') || line.includes('toast: true')) {
        console.log(file + ':' + (i + 1) + ': ' + line.trim());
      }
    });
  }
});
