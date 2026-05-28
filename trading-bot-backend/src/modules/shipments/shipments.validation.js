/**
 * Validation rules for Shipments module
 */
const validateCreateShipment = {
  body: (body) => {
    const errors = [];
    if (!body.supplierId) {
      errors.push('supplierId is required');
    }
    if (!body.clientId) {
      errors.push('clientId is required');
    }
    return errors;
  }
};

const validateUpdateShipment = {
  params: (params) => {
    const errors = [];
    if (!params.id || params.id.trim() === '') {
      errors.push('Shipment ID parameter is required');
    }
    return errors;
  }
};

module.exports = {
  validateCreateShipment,
  validateUpdateShipment
};
