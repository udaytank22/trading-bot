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

// ✅ Replaced inline role-name bypass with checkPermission
router.get('/', checkPermission('clients', 'read'), asyncWrapper(controller.getClients));
router.get('/:id', checkPermission('clients', 'read'), asyncWrapper(controller.getClient));

router.post('/bulk', checkPermission('clients', 'create'), asyncWrapper(controller.bulkImportClients));
router.post('/', checkPermission('clients', 'create'), validate(validateCreateClient), asyncWrapper(controller.createClient));
router.put('/:id', checkPermission('clients', 'update'), validate(validateUpdateClient), asyncWrapper(controller.updateClient));
router.delete('/:id', checkPermission('clients', 'delete'), asyncWrapper(controller.deleteClient));

module.exports = router;