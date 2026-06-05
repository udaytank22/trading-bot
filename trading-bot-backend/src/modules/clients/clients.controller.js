const service = require('./clients.service');
const { sendSuccess, sendError } = require('../../utils/response');
const { createAuditLog } = require('../auditLogs/auditLogs.service');

/**
 * Get all clients
 */
const getClients = async (req, res) => {
  const clients = await service.getAllClients();
  return sendSuccess(res, 'Clients retrieved successfully', clients);
};

/**
 * Get client by ID
 */
const getClient = async (req, res) => {
  const client = await service.getClientById(req.params.id);
  if (!client) {
    return sendError(res, 'Client not found', [], 404);
  }
  return sendSuccess(res, 'Client details retrieved successfully', client);
};

/**
 * Create a new client
 */
const createClient = async (req, res) => {
  const client = await service.createClient(req.body, req.user.id);

  await createAuditLog({
    userId: req.user.id,
    module: 'clients',
    action: 'create',
    recordId: client.id,
    newValue: client,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  return sendSuccess(res, 'Client created successfully', client, 201);
};

/**
 * Update client details
 */
const updateClient = async (req, res) => {
  const oldClient = await service.getClientById(req.params.id);
  if (!oldClient) {
    return sendError(res, 'Client not found', [], 404);
  }

  const client = await service.updateClient(req.params.id, req.body, req.user.id);

  await createAuditLog({
    userId: req.user.id,
    module: 'clients',
    action: 'update',
    recordId: client.id,
    oldValue: oldClient,
    newValue: client,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  return sendSuccess(res, 'Client updated successfully', client);
};

/**
 * Delete a client
 */
const deleteClient = async (req, res) => {
  const oldClient = await service.getClientById(req.params.id);
  if (!oldClient) {
    return sendError(res, 'Client not found', [], 404);
  }

  await service.deleteClient(req.params.id, req.user.id);

  await createAuditLog({
    userId: req.user.id,
    module: 'clients',
    action: 'delete',
    recordId: req.params.id,
    oldValue: oldClient,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  return sendSuccess(res, 'Client deleted successfully');
};

/**
 * Bulk import clients
 */
const bulkImportClients = async (req, res) => {
  const result = await service.bulkImportClients(req.body.clients, req.user.id);
  
  await createAuditLog({
    userId: req.user.id,
    module: 'clients',
    action: 'import',
    newValue: { count: result.successCount },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  return sendSuccess(res, `Successfully imported ${result.successCount} clients`, result);
};

module.exports = {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  bulkImportClients
};
