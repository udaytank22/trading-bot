/**
 * Validation rules for Documents module
 */
const validateCreateDocument = {
  body: (body) => {
    const errors = [];
    if (!body.title || typeof body.title !== 'string' || body.title.trim() === '') {
      errors.push('title is required');
    }
    if (!body.category || typeof body.category !== 'string' || body.category.trim() === '') {
      errors.push('category is required');
    }
    const validEntityTypes = ['EMPLOYEE', 'VEHICLE', 'COMPANY', 'SUPPLIER', 'CLIENT', 'INQUIRY', 'PO', 'INVOICE'];
    if (!body.entityType || !validEntityTypes.includes(body.entityType)) {
      errors.push(`entityType is required and must be one of: ${validEntityTypes.join(', ')}`);
    }
    if (!body.entityId || typeof body.entityId !== 'string') {
      errors.push('entityId is required');
    }
    return errors;
  }
};

const validateUpdateDocument = {
  params: (params) => {
    const errors = [];
    if (!params.id || params.id.trim() === '') {
      errors.push('Document ID parameter is required');
    }
    return errors;
  }
};

module.exports = {
  validateCreateDocument,
  validateUpdateDocument
};
