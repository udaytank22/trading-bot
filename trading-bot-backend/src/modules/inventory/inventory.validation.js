/**
 * Validation rules for Inventory module
 */
const validateCreateItem = {
  body: (body) => {
    const errors = [];
    if (!body.itemName || typeof body.itemName !== 'string' || body.itemName.trim() === '') {
      errors.push('itemName is required');
    }
    if (!body.sku || typeof body.sku !== 'string' || body.sku.trim() === '') {
      errors.push('sku is required');
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

const validateMovement = {
  body: (body) => {
    const errors = [];
    if (!body.inventoryItemId) {
      errors.push('inventoryItemId is required');
    }
    if (!body.warehouseId) {
      errors.push('warehouseId is required');
    }
    if (body.quantity === undefined || isNaN(parseInt(body.quantity, 10)) || parseInt(body.quantity, 10) === 0) {
      errors.push('quantity is required and must be a non-zero integer');
    }
    const validTypes = ['IN', 'OUT', 'ADJUSTMENT', 'RESERVED', 'RELEASED'];
    if (!body.type || !validTypes.includes(body.type)) {
      errors.push(`type must be one of: ${validTypes.join(', ')}`);
    }
    return errors;
  }
};

module.exports = {
  validateCreateItem,
  validateMovement
};
