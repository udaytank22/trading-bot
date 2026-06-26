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
const getSortingParams = (query, allowedFields = [], defaultField = 'createdAt', defaultOrder = 'desc') => {
  let sortBy = query.sortBy;
  if (!sortBy || !allowedFields.includes(sortBy)) {
    sortBy = defaultField;
  }
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
    if (typeof query.search === 'object') {
      const err = new Error('Invalid search parameter');
      err.statusCode = 400;
      throw err;
    }
    where.OR = searchFields.map((field) => ({
      [field]: {
        contains: String(query.search),
        mode: 'insensitive'
      }
    }));
  }

  // Handle strict equality filters
  filterFields.forEach((field) => {
    if (query[field] !== undefined && query[field] !== '') {
      if (typeof query[field] === 'object') {
        const err = new Error(`Invalid filter parameter for field: ${field}`);
        err.statusCode = 400;
        throw err;
      }
      
      const val = String(query[field]);
      if (val === 'true') {
        where[field] = true;
      } else if (val === 'false') {
        where[field] = false;
      } else {
        where[field] = val; // coerced to string, or Prisma will attempt conversion
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
