const prisma = require('../../prisma/client');

/**
 * Get all client quotations
 */
const getAllQuotations = async () => {
  return await prisma.clientQuotation.findMany({
    where: { deletedAt: null },
    include: {
      inquiry: {
        include: {
          client: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
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
