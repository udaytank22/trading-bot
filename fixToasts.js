const fs = require('fs');
const path = require('path');

const filesToFix = [
  'web/src/features/accounts/modals/AddAccountModal.jsx',
  'web/src/features/client-portal/ClientRFQsPage.jsx',
  'web/src/features/documents/modals/AddDocumentModal.jsx',
  'web/src/features/employees/modals/AddEmployeeModal.jsx',
  'web/src/features/inquiries/modals/AddInquiryModal.jsx',
  'web/src/features/inquiries/modals/QuoteModal.jsx',
  'web/src/features/invoices/InvoiceDetailsPage.jsx',
  'web/src/features/invoices/modals/PaymentModal.jsx',
  'web/src/features/purchase-orders/modals/AddPurchaseOrderModal.jsx',
  'web/src/features/purchase-orders/PODetailsPage.jsx',
  'web/src/features/settings/components/VendorsTab.jsx',
  'web/src/features/supply/modals/AddSupplyModal.jsx',
  'web/src/features/supply/SupplyDetailsPage.jsx'
];

let updatedCount = 0;

filesToFix.forEach(file => {
  const fullPath = path.resolve(__dirname, file);
  if (!fs.existsSync(fullPath)) return;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let original = content;

  // We are looking for something like:
  // toast: true, position: 'top-end', icon: 'success',
  // OR
  // toast: true,
  
  // Replace toast configurations that don't have showConfirmButton: false
  // A simple way is to find "toast: true," and if the Swal.fire block doesn't have "showConfirmButton", we inject it.
  
  const regex = /Swal\.fire\(\s*\{([^}]+toast:\s*true[^}]+)\}\s*\)/g;
  content = content.replace(regex, (match, body) => {
    if (!body.includes('showConfirmButton')) {
      return match.replace("toast: true,", "toast: true, showConfirmButton: false,");
    }
    return match;
  });

  if (content !== original) {
    fs.writeFileSync(fullPath, content);
    console.log('Fixed ' + file);
    updatedCount++;
  }
});

console.log('Done fixing ' + updatedCount + ' files.');
