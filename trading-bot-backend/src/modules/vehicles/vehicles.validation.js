const { z } = require('zod');

const validateCreateVehicle = {
  body: z.object({
    vehicle_no: z.string().min(1, 'Vehicle number is required and must be a string'),
    driverName: z.string().optional(),
    capacity: z.string().optional(),
    status: z.string().optional(),
    currentLocation: z.string().optional()
  }).passthrough()
};

const validateUpdateVehicle = {
  params: z.object({
    id: z.string().min(1, 'Vehicle ID parameter is required')
  }),
  body: z.object({
    vehicle_no: z.string().min(1).optional(),
    driverName: z.string().optional(),
    capacity: z.string().optional(),
    status: z.string().optional(),
    currentLocation: z.string().optional()
  }).passthrough()
};

module.exports = {
  validateCreateVehicle,
  validateUpdateVehicle
};
