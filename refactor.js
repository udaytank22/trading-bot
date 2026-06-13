const fs = require('fs');
const path = require('path');

const replacements = [
  {
    file: 'web/src/features/inquiries/InquiriesPage.jsx',
    changes: [
      { from: 'showToast("New inquiry created successfully", "success");', to: 'showToast(TOAST_MESSAGES.INQUIRIES.CREATED, "success");' },
      { from: 'showToast("Failed to create inquiry", "error");', to: 'showToast(TOAST_MESSAGES.INQUIRIES.CREATE_ERROR, "error");' },
      { from: 'showToast("Please create a client in settings first.", "error");', to: 'showToast(TOAST_MESSAGES.INQUIRIES.REQUIRE_CLIENT, "error");' }
    ]
  },
  {
    file: 'web/src/features/inquiries/InquiryDetailsPage.jsx',
    changes: [
      { from: "title: 'Stock Check Recorded', text: 'Suppliers linked successfully.'", to: "...TOAST_MESSAGES.INQUIRIES.STOCK_CHECK" },
      { from: "title: 'Approved', text: 'Quotation approved by Admin.'", to: "...TOAST_MESSAGES.INQUIRIES.QUOTE_APPROVED" },
      { from: "title: 'Submitted', text: 'Prices quoted. Sent to Team Lead for review.'", to: "...TOAST_MESSAGES.INQUIRIES.QUOTE_SUBMITTED_TL" },
      { from: "title: 'Submitted', text: 'Margin approved. Sent for Admin approval.'", to: "...TOAST_MESSAGES.INQUIRIES.MARGIN_APPROVED" },
      { from: "title: 'Accepted', text: 'Deal approved.'", to: "...TOAST_MESSAGES.INQUIRIES.DEAL_ACCEPTED" },
      { from: "title: 'Deal Confirmed', text: 'Deal moved to Supply.'", to: "...TOAST_MESSAGES.INQUIRIES.DEAL_CONFIRMED" },
      { from: "title: 'RFQ Closed', text: 'Inquiry is now in TL Review.'", to: "...TOAST_MESSAGES.INQUIRIES.RFQ_CLOSED" },
      { from: "title: 'Quote Selected', text: 'Supplier quote selected and client quote updated.'", to: "...TOAST_MESSAGES.INQUIRIES.QUOTE_SELECTED" },
      { from: "title: 'Selection Saved', text: \\`\\${productName} will be sourced from this supplier.\\`", to: "...TOAST_MESSAGES.INQUIRIES.SELECTION_SAVED(productName)" },
      { from: "title: 'Sourcing Confirmed!', text: 'Client quotation has been updated.'", to: "...TOAST_MESSAGES.INQUIRIES.SOURCING_CONFIRMED" }
    ]
  },
  {
    file: 'web/src/features/purchase-orders/PurchaseOrdersPage.jsx',
    changes: [
      { from: 'showToast("Purchase order created successfully", "success");', to: 'showToast(TOAST_MESSAGES.PURCHASE_ORDERS.CREATED, "success");' },
      { from: 'showToast(res.message || "Failed to create purchase order", "error");', to: 'showToast(res.message || TOAST_MESSAGES.PURCHASE_ORDERS.CREATE_ERROR, "error");' },
      { from: 'showToast("An error occurred while saving purchase order", "error");', to: 'showToast(TOAST_MESSAGES.PURCHASE_ORDERS.SAVE_ERROR, "error");' }
    ]
  },
  {
    file: 'web/src/features/settings/components/ClientsTab.jsx',
    changes: [
      { from: "showToast(`Successfully processed ${res.data?.successCount || clientsToImport.length} rows. ${failCount} failed due to missing fields.`, 'success');", to: "showToast(TOAST_MESSAGES.SETTINGS.IMPORT.SUCCESS(res.data?.successCount || clientsToImport.length, failCount), 'success');" },
      { from: "showToast(`Failed to import data.`, 'error');", to: "showToast(TOAST_MESSAGES.COMMON.IMPORT_FAILED, 'error');" },
      { from: "showToast(`Error importing data.`, 'error');", to: "showToast(TOAST_MESSAGES.COMMON.IMPORT_ERROR, 'error');" },
      { from: "showToast(`No valid rows to import. ${failCount} failed.`, 'info');", to: "showToast(TOAST_MESSAGES.SETTINGS.IMPORT.NO_VALID_ROWS(failCount), 'info');" }
    ]
  },
  {
    file: 'web/src/features/settings/components/GeneralSettingsTab.jsx',
    changes: [
      { from: "showToast('Margin must be between 1 and 100.', 'error');", to: "showToast(TOAST_MESSAGES.SETTINGS.GENERAL.MARGIN_ERROR, 'error');" },
      { from: "showToast('Please enter a valid email address.', 'error');", to: "showToast(TOAST_MESSAGES.COMMON.INVALID_EMAIL, 'error');" },
      { from: "showToast('Settings saved!', 'success');", to: "showToast(TOAST_MESSAGES.SETTINGS.GENERAL.SAVED, 'success');" },
      { from: "showToast('Settings reset to defaults', 'success');", to: "showToast(TOAST_MESSAGES.SETTINGS.GENERAL.RESET, 'success');" }
    ]
  },
  {
    file: 'web/src/features/settings/components/ProductsTab.jsx',
    changes: [
      { from: "showToast(editItem ? 'Product updated successfully!' : 'Product added successfully!', 'success');", to: "showToast(editItem ? TOAST_MESSAGES.SETTINGS.PRODUCTS.UPDATED : TOAST_MESSAGES.SETTINGS.PRODUCTS.ADDED, 'success');" },
      { from: "showToast(e.response?.data?.message || 'Failed to save product', 'error');", to: "showToast(e.response?.data?.message || TOAST_MESSAGES.SETTINGS.PRODUCTS.SAVE_ERROR, 'error');" },
      { from: "showToast(`Successfully processed ${successCount} rows. ${failCount} failed.`, failCount > 0 ? 'info' : 'success');", to: "showToast(TOAST_MESSAGES.SETTINGS.IMPORT.PARTIAL(successCount, failCount), failCount > 0 ? 'info' : 'success');" }
    ]
  },
  {
    file: 'web/src/features/settings/components/RolePermissionsTab.jsx',
    changes: [
      { from: "showToast(`${role} access reset to default`, 'success');", to: "showToast(TOAST_MESSAGES.SETTINGS.ROLES.ROLE_RESET(role), 'success');" },
      { from: "showToast('All role permissions reset to default', 'success');", to: "showToast(TOAST_MESSAGES.SETTINGS.ROLES.ALL_RESET, 'success');" },
      { from: "showToast('Permissions saved successfully!', 'success');", to: "showToast(TOAST_MESSAGES.SETTINGS.ROLES.SAVED, 'success');" }
    ]
  },
  {
    file: 'web/src/features/settings/components/VehiclesTab.jsx',
    changes: [
      { from: "showToast(`Successfully processed ${res.data?.successCount || validVehicles.length} vehicles. ${failCount} failed.`, 'success');", to: "showToast(TOAST_MESSAGES.SETTINGS.IMPORT.SUCCESS(res.data?.successCount || validVehicles.length, failCount, 'vehicles'), 'success');" },
      { from: "showToast('Failed to import data.', 'error');", to: "showToast(TOAST_MESSAGES.COMMON.IMPORT_FAILED, 'error');" },
      { from: "showToast('Error importing data.', 'error');", to: "showToast(TOAST_MESSAGES.COMMON.IMPORT_ERROR, 'error');" },
      { from: "showToast(`No valid rows to import. ${failCount} failed.`, 'info');", to: "showToast(TOAST_MESSAGES.SETTINGS.IMPORT.NO_VALID_ROWS(failCount), 'info');" }
    ]
  },
  {
    file: 'web/src/features/settings/components/VendorsTab.jsx',
    changes: [
      { from: "title: activate ? 'Access Reactivated' : 'Access Revoked'", to: "title: activate ? TOAST_MESSAGES.SETTINGS.VENDORS.ACCESS_REACTIVATED : TOAST_MESSAGES.SETTINGS.VENDORS.ACCESS_REVOKED" },
      { from: "showToast(`Successfully processed ${res.data?.successCount || suppliersToImport.length} rows. ${failCount} failed due to missing fields.`, 'success');", to: "showToast(TOAST_MESSAGES.SETTINGS.IMPORT.SUCCESS(res.data?.successCount || suppliersToImport.length, failCount), 'success');" },
      { from: "showToast(`Failed to import data.`, 'error');", to: "showToast(TOAST_MESSAGES.COMMON.IMPORT_FAILED, 'error');" },
      { from: "showToast(`Error importing data.`, 'error');", to: "showToast(TOAST_MESSAGES.COMMON.IMPORT_ERROR, 'error');" },
      { from: "showToast(`No valid rows to import. ${failCount} failed.`, 'info');", to: "showToast(TOAST_MESSAGES.SETTINGS.IMPORT.NO_VALID_ROWS(failCount), 'info');" },
      { from: "showToast('Vendor must have an email address.', 'warning');", to: "showToast(TOAST_MESSAGES.SETTINGS.VENDORS.REQUIRE_EMAIL, 'warning');" },
      { from: "showToast('Password must be at least 6 characters.', 'warning');", to: "showToast(TOAST_MESSAGES.AUTH.PASSWORD_MIN_LENGTH, 'warning');" }
    ]
  },
  {
    file: 'web/src/features/employees/EmployeesPage.jsx',
    changes: [
      { from: 'showToast("Employee updated successfully", "success");', to: 'showToast(TOAST_MESSAGES.EMPLOYEES.UPDATED, "success");' },
      { from: 'showToast(res.message || "Failed to update employee", "error");', to: 'showToast(res.message || TOAST_MESSAGES.EMPLOYEES.UPDATE_ERROR, "error");' },
      { from: 'showToast("New employee registered", "success");', to: 'showToast(TOAST_MESSAGES.EMPLOYEES.REGISTERED, "success");' },
      { from: 'showToast(res.message || "Failed to register employee", "error");', to: 'showToast(res.message || TOAST_MESSAGES.EMPLOYEES.REGISTER_ERROR, "error");' },
      { from: 'showToast("An error occurred while saving employee details", "error");', to: 'showToast(TOAST_MESSAGES.EMPLOYEES.SAVE_ERROR, "error");' },
      { from: 'showToast("Employee record deleted", "success");', to: 'showToast(TOAST_MESSAGES.EMPLOYEES.DELETED, "success");' },
      { from: 'showToast(res.message || "Failed to delete employee", "error");', to: 'showToast(res.message || TOAST_MESSAGES.EMPLOYEES.DELETE_ERROR, "error");' },
      { from: 'showToast("An error occurred while deleting employee", "error");', to: 'showToast(TOAST_MESSAGES.EMPLOYEES.DELETE_SYSTEM_ERROR, "error");' }
    ]
  },
  {
    file: 'web/src/features/documents/DocumentsPage.jsx',
    changes: [
      { from: 'showToast("Document deleted successfully", "success");', to: 'showToast(TOAST_MESSAGES.DOCUMENTS.DELETED, "success");' },
      { from: 'showToast(res.message || "Failed to delete document", "error");', to: 'showToast(res.message || TOAST_MESSAGES.DOCUMENTS.DELETE_ERROR, "error");' },
      { from: 'showToast("An error occurred while deleting document", "error");', to: 'showToast(TOAST_MESSAGES.DOCUMENTS.DELETE_SYSTEM_ERROR, "error");' },
      { from: 'showToast("Document updated successfully", "success");', to: 'showToast(TOAST_MESSAGES.DOCUMENTS.UPDATED, "success");' },
      { from: 'showToast(res.message || "Failed to update document", "error");', to: 'showToast(res.message || TOAST_MESSAGES.DOCUMENTS.UPDATE_ERROR, "error");' },
      { from: 'showToast("Document added successfully", "success");', to: 'showToast(TOAST_MESSAGES.DOCUMENTS.ADDED, "success");' },
      { from: 'showToast(res.message || "Failed to add document", "error");', to: 'showToast(res.message || TOAST_MESSAGES.DOCUMENTS.ADD_ERROR, "error");' },
      { from: 'showToast("An error occurred while saving document", "error");', to: 'showToast(TOAST_MESSAGES.DOCUMENTS.SAVE_ERROR, "error");' }
    ]
  },
  {
    file: 'web/src/features/accounts/AccountPage.jsx',
    changes: [
      { from: 'showToast("Account deleted successfully", "success");', to: 'showToast(TOAST_MESSAGES.ACCOUNTS.DELETED, "success");' },
      { from: 'showToast(res.message || "Failed to delete bank account", "error");', to: 'showToast(res.message || TOAST_MESSAGES.ACCOUNTS.DELETE_ERROR, "error");' }
    ]
  },
  {
    file: 'web/src/context/SocketContext.jsx',
    changes: []
  }
];

let importCount = 0;

replacements.forEach(({ file, changes }) => {
  if (changes.length === 0) return;
  const p = path.resolve(__dirname, file);
  if (!fs.existsSync(p)) return;
  let content = fs.readFileSync(p, 'utf8');
  let original = content;

  // Replace lines
  changes.forEach(c => {
    content = content.replace(c.from, c.to);
  });

  // Add import if modified
  if (content !== original) {
    if (!content.includes('TOAST_MESSAGES')) {
       // Should not happen as we just added it, but let's check
    }
    
    if (!content.includes("import { TOAST_MESSAGES }")) {
      const depth = file.split('/').length - 3; // e.g. web/src/features/accounts/AccountPage.jsx => 5 - 3 = 2
      let prefix = '';
      if (depth === 0) prefix = './';
      else if (depth === 1) prefix = '../';
      else if (depth === 2) prefix = '../../';
      else if (depth === 3) prefix = '../../../';
      else if (depth === 4) prefix = '../../../../';
      
      const importStatement = `import { TOAST_MESSAGES } from '${prefix}constants/toastMessages';\n`;
      
      // Find first import to append to
      const importMatch = content.match(/^import .*$/m);
      if (importMatch) {
         content = content.replace(importMatch[0], importStatement + importMatch[0]);
      } else {
         content = importStatement + '\n' + content;
      }
      importCount++;
    }
    fs.writeFileSync(p, content);
    console.log('Updated ' + file);
  }
});

console.log('Done modifying ' + importCount + ' files.');
