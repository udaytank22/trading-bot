/**
 * Extract pagination parameters from query
 */
const getPaginationParams = (query) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Extract sorting parameters from query
 */
const getSortingParams = (query, defaultField = 'createdAt', defaultOrder = 'desc') => {
  const sortBy = query.sortBy || defaultField;
  const sortOrder = (query.sortOrder || defaultOrder).toLowerCase() === 'asc' ? 'asc' : 'desc';

  return { [sortBy]: sortOrder };
};

/**
 * Extract search and filter terms to pass into Prisma 'where' clause
 */
const getSearchAndFilters = (query, searchFields = [], filterFields = []) => {
  const where = { deletedAt: null }; // Soft delete filter by default

  // Handle active record filtering
  if (query.isActive !== undefined) {
    where.isActive = query.isActive === 'true';
  }

  // Handle standard search fields (OR match)
  if (query.search && searchFields.length > 0) {
    where.OR = searchFields.map((field) => ({
      [field]: {
        contains: query.search,
        mode: 'insensitive'
      }
    }));
  }

  // Handle strict equality filters
  filterFields.forEach((field) => {
    if (query[field] !== undefined && query[field] !== '') {
      if (query[field] === 'true') {
        where[field] = true;
      } else if (query[field] === 'false') {
        where[field] = false;
      } else {
        where[field] = query[field];
      }
    }
  });

  return where;
};

module.exports = {
  getPaginationParams,
  getSortingParams,
  getSearchAndFilters
};
