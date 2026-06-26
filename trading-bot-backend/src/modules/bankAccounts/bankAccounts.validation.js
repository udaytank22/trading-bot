const { z } = require('zod');

/**
 * Validation rules for Bank Accounts module
 */
const validateCreateBankAccount = {
  body: z.object({
    bankName: z.string().min(1, 'bankName is required'),
    accountHolderName: z.string().min(1, 'accountHolderName is required'),
    accountNumber: z.string().min(1, 'accountNumber is required'),
    ifscCode: z.string().optional(),
    swiftCode: z.string().optional(),
    routingNumber: z.string().optional(),
    currency: z.string().optional(),
    branchAddress: z.string().optional()
  }).passthrough()
};

const validateUpdateBankAccount = {
  params: z.object({
    id: z.string().min(1, 'Bank Account ID parameter is required')
  }),
  body: z.object({
    bankName: z.string().min(1).optional(),
    accountHolderName: z.string().min(1).optional(),
    accountNumber: z.string().min(1).optional(),
    ifscCode: z.string().optional(),
    swiftCode: z.string().optional(),
    routingNumber: z.string().optional(),
    currency: z.string().optional(),
    branchAddress: z.string().optional()
  }).passthrough()
};

module.exports = {
  validateCreateBankAccount,
  validateUpdateBankAccount
};
