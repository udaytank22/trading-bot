const express = require('express');
const router = express.Router();
const controller = require('./bankAccounts.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const { checkPermission } = require('../../middleware/permission.middleware');
const validate = require('../../middleware/validation.middleware');
const { validateCreateBankAccount, validateUpdateBankAccount } = require('./bankAccounts.validation');
const asyncWrapper = require('../../utils/asyncWrapper');

// Protect all routes
router.use(authMiddleware);

router.get('/', checkPermission('bankAccounts', 'read'), asyncWrapper(controller.getBankAccounts));
router.get('/:id', checkPermission('bankAccounts', 'read'), asyncWrapper(controller.getBankAccount));
router.post('/', checkPermission('bankAccounts', 'create'), validate(validateCreateBankAccount), asyncWrapper(controller.createBankAccount));
router.put('/:id', checkPermission('bankAccounts', 'update'), validate(validateUpdateBankAccount), asyncWrapper(controller.updateBankAccount));
router.delete('/:id', checkPermission('bankAccounts', 'delete'), asyncWrapper(controller.deleteBankAccount));

module.exports = router;
