/**
 * Validation rules for Products module
 */
const validateCreateProduct = {
  body: (body) => {
    const errors = [];
    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      errors.push('Product name is required and must be a string');
    }
    if (!body.sku || typeof body.sku !== 'string' || body.sku.trim() === '') {
      errors.push('Product SKU is required');
    }
    if (body.sellingPrice === undefined || isNaN(parseFloat(body.sellingPrice))) {
      errors.push('sellingPrice is required and must be a number');
    }
    if (body.purchasePrice === undefined || isNaN(parseFloat(body.purchasePrice))) {
      errors.push('purchasePrice is required and must be a number');
    }
    return errors;
  }
};

const validateUpdateProduct = {
  params: (params) => {
    const errors = [];
    if (!params.id || params.id.trim() === '') {
      errors.push('Product ID parameter is required');
    }
    return errors;
  },
  body: (body) => {
    const errors = [];
    if (body.sellingPrice !== undefined && isNaN(parseFloat(body.sellingPrice))) {
      errors.push('sellingPrice must be a number');
    }
    if (body.purchasePrice !== undefined && isNaN(parseFloat(body.purchasePrice))) {
      errors.push('purchasePrice must be a number');
    }
    return errors;
  }
};

module.exports = {
  validateCreateProduct,
  validateUpdateProduct
};
