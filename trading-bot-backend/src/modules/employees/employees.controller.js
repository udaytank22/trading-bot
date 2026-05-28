const service = require('./employees.service');
const { sendSuccess, sendError } = require('../../utils/response');
const { createAuditLog } = require('../auditLogs/auditLogs.service');

/**
 * Get all employees
 */
const getEmployees = async (req, res) => {
  const employees = await service.getAllEmployees();
  return sendSuccess(res, 'Employees list retrieved successfully', employees);
};

/**
 * Get employee details by ID
 */
const getEmployee = async (req, res) => {
  const employee = await service.getEmployeeById(req.params.id);
  if (!employee) {
    return sendError(res, 'Employee not found', [], 404);
  }
  return sendSuccess(res, 'Employee details retrieved successfully', employee);
};

/**
 * Create a new employee
 */
const createEmployee = async (req, res) => {
  try {
    const employee = await service.createEmployee(req.body, req.user.id);

    await createAuditLog({
      userId: req.user.id,
      module: 'employees',
      action: 'create',
      recordId: employee.id,
      newValue: employee,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return sendSuccess(res, 'Employee profile created successfully', employee, 201);
  } catch (error) {
    return sendError(res, error.message, [], 400);
  }
};

/**
 * Update employee details
 */
const updateEmployee = async (req, res) => {
  const old = await service.getEmployeeById(req.params.id);
  if (!old) {
    return sendError(res, 'Employee not found', [], 404);
  }

  try {
    const employee = await service.updateEmployee(req.params.id, req.body, req.user.id);

    await createAuditLog({
      userId: req.user.id,
      module: 'employees',
      action: 'update',
      recordId: employee.id,
      oldValue: old,
      newValue: employee,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return sendSuccess(res, 'Employee profile updated successfully', employee);
  } catch (error) {
    return sendError(res, error.message, [], 400);
  }
};

/**
 * Delete employee profile
 */
const deleteEmployee = async (req, res) => {
  const old = await service.getEmployeeById(req.params.id);
  if (!old) {
    return sendError(res, 'Employee not found', [], 404);
  }

  try {
    await service.deleteEmployee(req.params.id, req.user.id);

    await createAuditLog({
      userId: req.user.id,
      module: 'employees',
      action: 'delete',
      recordId: req.params.id,
      oldValue: old,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return sendSuccess(res, 'Employee profile deleted successfully');
  } catch (error) {
    return sendError(res, error.message, [], 400);
  }
};

/**
 * Log employee attendance
 */
const logAttendance = async (req, res) => {
  try {
    const attendance = await service.logAttendance(req.params.id, req.body);

    await createAuditLog({
      userId: req.user.id,
      module: 'employees',
      action: 'update',
      recordId: attendance.id,
      newValue: attendance,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return sendSuccess(res, 'Employee attendance recorded successfully', attendance);
  } catch (error) {
    return sendError(res, error.message, [], 400);
  }
};

module.exports = {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  logAttendance
};
