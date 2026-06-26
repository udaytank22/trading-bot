const service = require('./employees.service');
const { sendSuccess, sendError } = require('../../utils/response');


/**
 * Get all employees
 */
const getEmployees = async (req, res) => {
  const { data, total } = await service.getAllEmployees(req.query);
  const meta = {
    totalItems: total,
    currentPage: req.query.page ? parseInt(req.query.page) : 1,
    pageSize: req.query.pageSize ? parseInt(req.query.pageSize) : total,
    totalPages: req.query.pageSize ? Math.ceil(total / parseInt(req.query.pageSize)) : 1
  };
  return sendSuccess(res, 'Employees list retrieved successfully', data, 200, meta);
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
