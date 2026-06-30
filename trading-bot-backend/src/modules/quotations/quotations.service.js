const prisma = require('../../prisma/client');

const { getPaginationParams } = require('../../utils/queryHelper');

/**
 * Get all client quotations
 */
const getAllQuotations = async (query = {}) => {
  const where = { deletedAt: null };
  const { skip, take } = getPaginationParams(query);

  const [quotations, total] = await Promise.all([
    prisma.clientQuotation.findMany({
      where,
      include: {
        inquiry: {
          include: {
            client: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take
    }),
    prisma.clientQuotation.count({ where })
  ]);

  return { data: quotations, total };
};

/**
 * Get client quotation details by ID
 */
const getQuotationById = async (id) => {
  return await prisma.clientQuotation.findFirst({
    where: { id, deletedAt: null },
    include: {
      inquiry: {
        include: {
          client: true,
          items: true
        }
      },
      items: {
        include: {
          inquiryItem: true
        }
      }
    }
  });
};

module.exports = {
  getAllQuotations,
  getQuotationById
};
