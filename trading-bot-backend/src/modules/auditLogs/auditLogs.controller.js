const prisma = require('../../prisma/client');
const { sendSuccess } = require('../../utils/response');
const { getPaginationParams, getSortingParams, getSearchAndFilters } = require('../../utils/queryHelper');

/**
 * Retrieve paginated audit logs with search/filters
 */
const getAuditLogs = async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const orderBy = getSortingParams(req.query, ['createdAt', 'module', 'action', 'userId'], 'createdAt', 'desc');
  
  // Custom search fields and filters
  const where = getSearchAndFilters(req.query, ['module', 'action'], ['userId', 'module', 'action']);

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    }),
    prisma.auditLog.count({ where })
  ]);

  return sendSuccess(res, 'Audit logs retrieved successfully', {
    logs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  });
};

module.exports = {
  getAuditLogs
};
