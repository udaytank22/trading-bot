const service = require('./documents.service');
const { sendSuccess, sendError } = require('../../utils/response');
const { createAuditLog } = require('../auditLogs/auditLogs.service');

/**
 * Get all documents
 */
const getDocuments = async (req, res) => {
  const { data, total } = await service.getAllDocuments(req.query);
  const meta = {
    totalItems: total,
    currentPage: req.query.page ? parseInt(req.query.page) : 1,
    pageSize: req.query.pageSize ? parseInt(req.query.pageSize) : total,
    totalPages: req.query.pageSize ? Math.ceil(total / parseInt(req.query.pageSize)) : 1
  };
  return sendSuccess(res, 'Documents list retrieved successfully', data, 200, meta);
};

/**
 * Get document details by ID
 */
const getDocument = async (req, res) => {
  const doc = await service.getDocumentById(req.params.id);
  if (!doc) {
    return sendError(res, 'Document not found', [], 404);
  }
  return sendSuccess(res, 'Document details retrieved successfully', doc);
};

/**
 * Create a new document metadata record
 */
const createDocument = async (req, res) => {
  try {
    const doc = await service.createDocument(req.body, req.user.id);

    await createAuditLog({
      userId: req.user.id,
      module: 'documents',
      action: 'create',
      recordId: doc.id,
      newValue: doc,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return sendSuccess(res, 'Document logged successfully', doc, 201);
  } catch (error) {
    return sendError(res, error.message, [], 400);
  }
};

/**
 * Update document details
 */
const updateDocument = async (req, res) => {
  const old = await service.getDocumentById(req.params.id);
  if (!old) {
    return sendError(res, 'Document not found', [], 404);
  }

  try {
    const doc = await service.updateDocument(req.params.id, req.body, req.user.id);

    await createAuditLog({
      userId: req.user.id,
      module: 'documents',
      action: 'update',
      recordId: doc.id,
      oldValue: old,
      newValue: doc,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return sendSuccess(res, 'Document details updated successfully', doc);
  } catch (error) {
    return sendError(res, error.message, [], 400);
  }
};

/**
 * Soft delete a document record
 */
const deleteDocument = async (req, res) => {
  const old = await service.getDocumentById(req.params.id);
  if (!old) {
    return sendError(res, 'Document not found', [], 404);
  }

  await service.deleteDocument(req.params.id, req.user.id);

  await createAuditLog({
    userId: req.user.id,
    module: 'documents',
    action: 'delete',
    recordId: req.params.id,
    oldValue: old,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  return sendSuccess(res, 'Document deleted successfully');
};

module.exports = {
  getDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument
};
