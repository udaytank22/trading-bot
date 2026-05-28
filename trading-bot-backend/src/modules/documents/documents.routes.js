const express = require('express');
const router = express.Router();
const controller = require('./documents.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const { checkPermission } = require('../../middleware/permission.middleware');
const validate = require('../../middleware/validation.middleware');
const { validateCreateDocument, validateUpdateDocument } = require('./documents.validation');
const asyncWrapper = require('../../utils/asyncWrapper');

// Protect all routes
router.use(authMiddleware);

router.get('/', checkPermission('documents', 'read'), asyncWrapper(controller.getDocuments));
router.get('/:id', checkPermission('documents', 'read'), asyncWrapper(controller.getDocument));
router.post('/', checkPermission('documents', 'create'), validate(validateCreateDocument), asyncWrapper(controller.createDocument));
router.put('/:id', checkPermission('documents', 'update'), validate(validateUpdateDocument), asyncWrapper(controller.updateDocument));
router.delete('/:id', checkPermission('documents', 'delete'), asyncWrapper(controller.deleteDocument));

module.exports = router;
