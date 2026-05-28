const service = require('./reports.service');
const { sendSuccess } = require('../../utils/response');

/**
 * Get dashboard stats
 */
const getDashboardStats = async (req, res) => {
  const stats = await service.getDashboardStats();
  return sendSuccess(res, 'Dashboard statistics retrieved successfully', stats);
};

/**
 * Get pipeline report
 */
const getPipelineReport = async (req, res) => {
  const report = await service.getInquiryPipelineReport();
  return sendSuccess(res, 'Pipeline report retrieved successfully', report);
};

/**
 * Get profit report
 */
const getProfitReport = async (req, res) => {
  const { startDate, endDate } = req.query;
  const report = await service.getProfitReport(startDate, endDate);
  return sendSuccess(res, 'Profit audit report retrieved successfully', report);
};

/**
 * Get invoice report
 */
const getInvoiceReport = async (req, res) => {
  const { startDate, endDate } = req.query;
  const report = await service.getInvoiceReport(startDate, endDate);
  return sendSuccess(res, 'Billing and invoicing report retrieved successfully', report);
};

/**
 * Get payment report
 */
const getPaymentReport = async (req, res) => {
  const { startDate, endDate } = req.query;
  const report = await service.getPaymentReport(startDate, endDate);
  return sendSuccess(res, 'Reconciled payments report retrieved successfully', report);
};

/**
 * Get inventory report
 */
const getInventoryReport = async (req, res) => {
  const report = await service.getInventoryReport();
  return sendSuccess(res, 'Inventory balances report retrieved successfully', report);
};

/**
 * Get employee report
 */
const getEmployeeReport = async (req, res) => {
  const report = await service.getEmployeeReport();
  return sendSuccess(res, 'Employee attendance summary report retrieved successfully', report);
};

/**
 * Get document expiry report
 */
const getDocumentExpiryReport = async (req, res) => {
  const report = await service.getDocumentExpiryReport();
  return sendSuccess(res, 'Document compliance expiry report retrieved successfully', report);
};

module.exports = {
  getDashboardStats,
  getPipelineReport,
  getProfitReport,
  getInvoiceReport,
  getPaymentReport,
  getInventoryReport,
  getEmployeeReport,
  getDocumentExpiryReport
};
