const fs = require('fs');
const path = require('path');

const filesToFix = [
  'web/src/features/accounts/modals/AddAccountModal.jsx',
  'web/src/features/documents/modals/AddDocumentModal.jsx',
  'web/src/features/employees/modals/AddEmployeeModal.jsx',
  'web/src/features/purchase-orders/modals/AddPurchaseOrderModal.jsx',
  'web/src/features/supply/modals/AddSupplyModal.jsx',
  'web/src/features/inquiries/modals/QuoteModal.jsx'
];

let updatedCount = 0;

filesToFix.forEach(file => {
  const fullPath = path.resolve(__dirname, file);
  if (!fs.existsSync(fullPath)) return;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let original = content;

  // Clean up duplicate toast: true
  content = content.replace(/toast:\s*true,\s*position:\s*['"]top-end['"],/g, '');
  content = content.replace(/toast:\s*true,\s*position:\s*['"]top-end['"]/g, '');

  // Make sure we have exactly one toast: true and one position: 'top-end' and one showConfirmButton: false
  // Actually, wait, let's just replace all Swal.fire({ ... toast: true ... }) with a clean one
  // Let's just fix the exact lines that caused duplicate keys
  content = content.replace(/toast: true,\s*position: "top-end",/g, '');
  content = content.replace(/toast: true,\s*position: 'top-end'/g, '');
  
  // Clean up stray toast: true,
  content = content.replace(/toast: true,\s*toast: true,/g, 'toast: true,');

  if (content !== original) {
    fs.writeFileSync(fullPath, content);
    console.log('Fixed ' + file);
    updatedCount++;
  }
});

console.log('Done fixing ' + updatedCount + ' files.');
