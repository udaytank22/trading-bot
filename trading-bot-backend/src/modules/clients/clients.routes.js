const express = require('express');
const router = express.Router();
const controller = require('./clients.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const { checkPermission } = require('../../middleware/permission.middleware');
const validate = require('../../middleware/validation.middleware');
const { validateCreateClient, validateUpdateClient } = require('./clients.validation');
const asyncWrapper = require('../../utils/asyncWrapper');

// All client routes are protected
router.use(authMiddleware);

router.get('/', (req, res, next) => {
  if (req.user && req.user.role && ['Employee', 'Super Admin', 'Admin', 'Team Lead'].includes(req.user.role.name)) {
    return next();
  }
  return checkPermission('clients', 'read')(req, res, next);
}, asyncWrapper(controller.getClients));

router.get('/:id', (req, res, next) => {
  if (req.user && req.user.role && ['Employee', 'Super Admin', 'Admin', 'Team Lead'].includes(req.user.role.name)) {
    return next();
  }
  return checkPermission('clients', 'read')(req, res, next);
}, asyncWrapper(controller.getClient));
router.post('/bulk', checkPermission('clients', 'create'), asyncWrapper(controller.bulkImportClients));
router.post('/', checkPermission('clients', 'create'), validate(validateCreateClient), asyncWrapper(controller.createClient));
router.put('/:id', checkPermission('clients', 'update'), validate(validateUpdateClient), asyncWrapper(controller.updateClient));
router.delete('/:id', checkPermission('clients', 'delete'), asyncWrapper(controller.deleteClient));

module.exports = router;
