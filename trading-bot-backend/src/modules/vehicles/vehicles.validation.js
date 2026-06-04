const validateCreateVehicle = {
  body: (body) => {
    const errors = [];
    if (!body.vehicle_no || typeof body.vehicle_no !== 'string' || body.vehicle_no.trim() === '') {
      errors.push('Vehicle number is required and must be a string');
    }
    return errors;
  }
};

const validateUpdateVehicle = {
  params: (params) => {
    const errors = [];
    if (!params.id || params.id.trim() === '') {
      errors.push('Vehicle ID parameter is required');
    }
    return errors;
  },
  body: (body) => {
    const errors = [];
    return errors;
  }
};

module.exports = {
  validateCreateVehicle,
  validateUpdateVehicle
};
