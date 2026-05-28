const prisma = require('../../prisma/client');

/**
 * Create an audit log record
 */
const createAuditLog = async ({ userId, module, action, recordId, oldValue, newValue, ipAddress, userAgent }) => {
  try {
    const data = {
      module,
      action,
      recordId: recordId ? String(recordId) : null,
      oldValue: oldValue ? (typeof oldValue === 'object' ? JSON.stringify(oldValue) : String(oldValue)) : null,
      newValue: newValue ? (typeof newValue === 'object' ? JSON.stringify(newValue) : String(newValue)) : null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null
    };

    if (userId) {
      data.userId = userId;
    }

    return await prisma.auditLog.create({
      data
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
};

module.exports = {
  createAuditLog
};
