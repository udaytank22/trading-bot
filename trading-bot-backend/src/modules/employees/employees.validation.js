const { z } = require('zod');

/**
 * Validation rules for Employees module
 */
const validateCreateEmployee = {
  body: z.object({
    fullName: z.string().min(1, 'fullName is required'),
    email: z.string().email('A valid email address is required'),
    phone: z.string().optional(),
    departmentId: z.coerce.number().optional(),
    managerId: z.coerce.number().optional()
  }).passthrough()
};

const validateAttendance = {
  body: z.object({
    employeeId: z.coerce.number().optional(),
    date: z.string().optional(),
    status: z.enum(['PRESENT', 'LATE', 'SICK_LEAVE', 'OFF_DAY'], {
      required_error: 'status is required',
      invalid_type_error: 'status must be one of: PRESENT, LATE, SICK_LEAVE, OFF_DAY'
    }),
    clockIn: z.string().optional(),
    clockOut: z.string().optional()
  }).passthrough()
};

module.exports = {
  validateCreateEmployee,
  validateAttendance
};
