const service = require('./bankAccounts.service');
const { sendSuccess, sendError } = require('../../utils/response');
const { createAuditLog } = require('../auditLogs/auditLogs.service');

/**
 * Get all bank accounts
 */
const getBankAccounts = async (req, res) => {
  const accounts = await service.getAllBankAccounts();
  return sendSuccess(res, 'Bank accounts list retrieved successfully', accounts);
};

/**
 * Get bank account details by ID
 */
const getBankAccount = async (req, res) => {
  const account = await service.getBankAccountById(req.params.id);
  if (!account) {
    return sendError(res, 'Bank account not found', [], 404);
  }
  return sendSuccess(res, 'Bank account details retrieved successfully', account);
};

/**
 * Create a new bank account
 */
const createBankAccount = async (req, res) => {
  try {
    const account = await service.createBankAccount(req.body, req.user.id);

    await createAuditLog({
      userId: req.user.id,
      module: 'bankAccounts',
      action: 'create',
      recordId: account.id,
      newValue: account,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return sendSuccess(res, 'Bank account created successfully', account, 201);
  } catch (error) {
    return sendError(res, error.message, [], 400);
  }
};

/**
 * Update bank account details
 */
const updateBankAccount = async (req, res) => {
  const old = await service.getBankAccountById(req.params.id);
  if (!old) {
    return sendError(res, 'Bank account not found', [], 404);
  }

  try {
    const account = await service.updateBankAccount(req.params.id, req.body, req.user.id);

    await createAuditLog({
      userId: req.user.id,
      module: 'bankAccounts',
      action: 'update',
      recordId: account.id,
      oldValue: old,
      newValue: account,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return sendSuccess(res, 'Bank account updated successfully', account);
  } catch (error) {
    return sendError(res, error.message, [], 400);
  }
};

/**
 * Delete bank account
 */
const deleteBankAccount = async (req, res) => {
  const old = await service.getBankAccountById(req.params.id);
  if (!old) {
    return sendError(res, 'Bank account not found', [], 404);
  }

  await service.deleteBankAccount(req.params.id, req.user.id);

  await createAuditLog({
    userId: req.user.id,
    module: 'bankAccounts',
    action: 'delete',
    recordId: req.params.id,
    oldValue: old,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  return sendSuccess(res, 'Bank account deleted successfully');
};

module.exports = {
  getBankAccounts,
  getBankAccount,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount
};
