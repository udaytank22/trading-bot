const service = require('./quotations.service');
const { sendSuccess, sendError } = require('../../utils/response');

/**
 * Get all quotations
 */
const getQuotations = async (req, res) => {
  const quotations = await service.getAllQuotations();
  return sendSuccess(res, 'Client quotations list retrieved successfully', quotations);
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
