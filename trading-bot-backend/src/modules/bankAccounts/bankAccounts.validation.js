/**
 * Validation rules for Bank Accounts module
 */
const validateCreateBankAccount = {
  body: (body) => {
    const errors = [];
    if (!body.bankName || typeof body.bankName !== 'string' || body.bankName.trim() === '') {
      errors.push('bankName is required');
    }
    if (!body.accountHolderName || typeof body.accountHolderName !== 'string' || body.accountHolderName.trim() === '') {
      errors.push('accountHolderName is required');
    }
    if (!body.accountNumber || typeof body.accountNumber !== 'string' || body.accountNumber.trim() === '') {
      errors.push('accountNumber is required');
    }
    return errors;
  }
};

const validateUpdateBankAccount = {
  params: (params) => {
    const errors = [];
    if (!params.id || params.id.trim() === '') {
      errors.push('Bank Account ID parameter is required');
    }
    return errors;
  }
};

module.exports = {
  validateCreateBankAccount,
  validateUpdateBankAccount
};
