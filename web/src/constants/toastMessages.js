export const TOAST_MESSAGES = {
  // Common generic messages
  COMMON: {
    ERROR_GENERIC: 'An error occurred.',
    SAVE_SUCCESS: 'Saved successfully!',
    DELETE_SUCCESS: 'Deleted successfully!',
    INVALID_EMAIL: 'Please enter a valid email address.',
    IMPORT_FAILED: 'Failed to import data.',
    IMPORT_ERROR: 'Error importing data.',
  },

  // Module specific messages
  AUTH: {
    PASSWORD_MIN_LENGTH: 'Password must be at least 6 characters.',
  },

  INQUIRIES: {
    CREATED: 'New inquiry created successfully',
    CREATE_ERROR: 'Failed to create inquiry',
    REQUIRE_CLIENT: 'Please create a client in settings first.',
    STOCK_CHECK: { title: 'Stock Check Recorded', text: 'Suppliers linked successfully.' },
    QUOTE_APPROVED: { title: 'Approved', text: 'Quotation approved by Admin.' },
    QUOTE_SUBMITTED_TL: { title: 'Submitted', text: 'Prices quoted. Sent to Team Lead for review.' },
    MARGIN_APPROVED: { title: 'Submitted', text: 'Margin approved. Sent for Admin approval.' },
    DEAL_ACCEPTED: { title: 'Accepted', text: 'Deal approved.' },
    DEAL_CONFIRMED: { title: 'Deal Confirmed', text: 'Deal moved to Supply.' },
    RFQ_CLOSED: { title: 'RFQ Closed', text: 'Inquiry is now in TL Review.' },
    QUOTE_SELECTED: { title: 'Quote Selected', text: 'Supplier quote selected and client quote updated.' },
    SELECTION_SAVED: (productName) => ({ title: 'Selection Saved', text: `${productName} will be sourced from this supplier.` }),
    SOURCING_CONFIRMED: { title: 'Sourcing Confirmed!', text: 'Client quotation has been updated.' }
  },

  PURCHASE_ORDERS: {
    CREATED: 'Purchase order created successfully',
    CREATE_ERROR: 'Failed to create purchase order',
    SAVE_ERROR: 'An error occurred while saving purchase order',
  },

  EMPLOYEES: {
    UPDATED: 'Employee updated successfully',
    UPDATE_ERROR: 'Failed to update employee',
    REGISTERED: 'New employee registered',
    REGISTER_ERROR: 'Failed to register employee',
    SAVE_ERROR: 'An error occurred while saving employee details',
    DELETED: 'Employee record deleted',
    DELETE_ERROR: 'Failed to delete employee',
    DELETE_SYSTEM_ERROR: 'An error occurred while deleting employee',
  },

  DOCUMENTS: {
    DELETED: 'Document deleted successfully',
    DELETE_ERROR: 'Failed to delete document',
    DELETE_SYSTEM_ERROR: 'An error occurred while deleting document',
    UPDATED: 'Document updated successfully',
    UPDATE_ERROR: 'Failed to update document',
    ADDED: 'Document added successfully',
    ADD_ERROR: 'Failed to add document',
    SAVE_ERROR: 'An error occurred while saving document',
  },

  ACCOUNTS: {
    DELETED: 'Account deleted successfully',
    DELETE_ERROR: 'Failed to delete bank account',
  },

  SETTINGS: {
    GENERAL: {
      MARGIN_ERROR: 'Margin must be between 1 and 100.',
      SAVED: 'Settings saved!',
      RESET: 'Settings reset to defaults',
    },
    ROLES: {
      ROLE_RESET: (role) => `${role} access reset to default`,
      ALL_RESET: 'All role permissions reset to default',
      SAVED: 'Permissions saved successfully!',
    },
    PRODUCTS: {
      ADDED: 'Product added successfully!',
      UPDATED: 'Product updated successfully!',
      SAVE_ERROR: 'Failed to save product',
    },
    VENDORS: {
      ACCESS_REACTIVATED: 'Access Reactivated',
      ACCESS_REVOKED: 'Access Revoked',
      REQUIRE_EMAIL: 'Vendor must have an email address.',
    },
    IMPORT: {
      SUCCESS: (successCount, failCount, unit = 'rows') => 
        `Successfully processed ${successCount} ${unit}. ${failCount} failed${unit === 'rows' ? ' due to missing fields.' : '.'}`,
      PARTIAL: (failCount) => `Successfully processed rows. ${failCount} failed.`,
      NO_VALID_ROWS: (failCount) => `No valid rows to import. ${failCount} failed.`,
    }
  }
};
