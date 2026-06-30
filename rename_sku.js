const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'trading-bot-backend/src/modules/products/products.service.js',
  'trading-bot-backend/src/modules/inventory/inventory.service.js',
  'trading-bot-backend/src/modules/inventory/inventory.validation.js',
  'trading-bot-backend/src/modules/reports/reports.service.js',
  'trading-bot-backend/src/modules/inquiries/inquiries.service.js',
  'web/src/features/settings/components/ProductsTab.jsx',
  'web/src/config/tableSchemas.js',
  'web/src/features/inventory/InventoryPage.jsx',
  'web/src/features/inventory/components/InventoryForm.jsx',
  'web/src/features/inventory/components/ViewDetails.jsx',
  'web/src/features/reports/ReportsPage.jsx',
  'web/src/features/supply/utils/generateGatePass.js',
  'web/src/features/supply/utils/generateDeliveryChallan.js',
  'web/src/features/inquiries/InquiryDetailsPage.jsx',
  'web/src/features/inquiries/modals/AdminApprovalModal.jsx',
  'web/src/features/inquiries/modals/StockCheckModal.jsx',
  'web/src/features/inquiries/modals/VerificationModal.jsx'
];

for (const relativePath of filesToUpdate) {
  const fullPath = path.join(__dirname, relativePath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replace sku -> impa
    content = content.replace(/sku/g, 'impa');
    
    // Replace SKU -> IMPA
    content = content.replace(/SKU/g, 'IMPA');
    
    // Replace Sku -> Impa
    content = content.replace(/Sku/g, 'Impa');
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated ${relativePath}`);
  } else {
    console.warn(`File not found: ${relativePath}`);
  }
}
