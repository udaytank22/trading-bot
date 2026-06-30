const service = require('./quotations.service');
const { sendSuccess, sendError } = require('../../utils/response');

/**
 * Get all quotations
 */
const getQuotations = async (req, res) => {
  const { data, total } = await service.getAllQuotations(req.query);
  const meta = {
    totalItems: total,
    currentPage: req.query.page ? parseInt(req.query.page) : 1,
    pageSize: req.query.pageSize ? parseInt(req.query.pageSize) : total,
    totalPages: req.query.pageSize ? Math.ceil(total / parseInt(req.query.pageSize)) : 1
  };
  return sendSuccess(res, 'Client quotations list retrieved successfully', data, 200, meta);
};

/**
 * Get quotation by ID
 */
const getQuotation = async (req, res) => {
  const quotation = await service.getQuotationById(req.params.id);
  if (!quotation) {
    return sendError(res, 'Quotation not found', [], 404);
  }
  return sendSuccess(res, 'Quotation details retrieved successfully', quotation);
};

module.exports = {
  getQuotations,
  getQuotation
};
