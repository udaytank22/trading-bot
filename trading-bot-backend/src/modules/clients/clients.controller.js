const service = require('./clients.service');
const { sendSuccess, sendError } = require('../../utils/response');


/**
 * Get all clients
 */
const getClients = async (req, res) => {
  const { data, total } = await service.getAllClients(req.query);
  const meta = {
    totalItems: total,
    currentPage: req.query.page ? parseInt(req.query.page) : 1,
    pageSize: req.query.pageSize ? parseInt(req.query.pageSize) : total,
    totalPages: req.query.pageSize ? Math.ceil(total / parseInt(req.query.pageSize)) : 1
  };
  return sendSuccess(res, 'Clients retrieved successfully', data, 200, meta);
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

  

  return sendSuccess(res, 'Client deleted successfully');
};

/**
 * Bulk import clients
 */
const bulkImportClients = async (req, res) => {
  const result = await service.bulkImportClients(req.body.clients, req.user.id);
  
  

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
