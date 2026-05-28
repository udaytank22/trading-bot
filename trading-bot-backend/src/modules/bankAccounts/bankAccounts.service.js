const prisma = require('../../prisma/client');

/**
 * Get all bank accounts
 */
const getAllBankAccounts = async () => {
  return await prisma.bankAccount.findMany({
    where: { deletedAt: null },
    orderBy: { bankName: 'asc' }
  });
};

/**
 * Get bank account by ID
 */
const getBankAccountById = async (id) => {
  return await prisma.bankAccount.findFirst({
    where: { id, deletedAt: null }
  });
};

/**
 * Create a bank account
 */
const createBankAccount = async (data, creatorId) => {
  return await prisma.bankAccount.create({
    data: {
      bankName: data.bankName,
      accountHolderName: data.accountHolderName,
      accountNumber: data.accountNumber,
      routingNumber: data.routingNumber || null,
      swiftCode: data.swiftCode || null,
      currency: data.currency || 'INR',
      branch: data.branch || null,
      status: data.status || 'ACTIVE',
      createdById: creatorId
    }
  });
};

/**
 * Update bank account details
 */
const updateBankAccount = async (id, data, updaterId) => {
  return await prisma.bankAccount.update({
    where: { id },
    data: {
      bankName: data.bankName,
      accountHolderName: data.accountHolderName,
      accountNumber: data.accountNumber,
      routingNumber: data.routingNumber,
      swiftCode: data.swiftCode,
      currency: data.currency,
      branch: data.branch,
      status: data.status,
      updatedById: updaterId
    }
  });
};

/**
 * Soft delete bank account
 */
const deleteBankAccount = async (id, updaterId) => {
  return await prisma.bankAccount.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      isActive: false,
      status: 'INACTIVE',
      updatedById: updaterId
    }
  });
};

module.exports = {
  getAllBankAccounts,
  getBankAccountById,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount
};
