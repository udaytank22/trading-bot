const { z } = require('zod');

/**
 * Validation rules for Shipments module
 */
const validateCreateShipment = {
  body: z.object({
    supplierId: z.coerce.number({
      required_error: 'supplierId is required',
      invalid_type_error: 'supplierId must be a number'
    }),
    clientId: z.coerce.number({
      required_error: 'clientId is required',
      invalid_type_error: 'clientId must be a number'
    }),
    origin: z.string().optional(),
    destination: z.string().optional(),
    trackingNumber: z.string().optional(),
    estimatedDelivery: z.string().optional(),
    status: z.string().optional()
  }).passthrough()
};

const validateUpdateShipment = {
  params: z.object({
    id: z.string().min(1, 'Shipment ID parameter is required')
  }),
  body: z.object({
    supplierId: z.coerce.number().optional(),
    clientId: z.coerce.number().optional(),
    origin: z.string().optional(),
    destination: z.string().optional(),
    trackingNumber: z.string().optional(),
    estimatedDelivery: z.string().optional(),
    status: z.string().optional()
  }).passthrough()
};

module.exports = {
  validateCreateShipment,
  validateUpdateShipment
};
