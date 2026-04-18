/**
 * Utility for Standardized Pagination
 * Standardizes output for high-performance frontend components
 */
export const getPaginatedData = async ({
  model,
  query,
  where = {},
  include = null,
  orderBy = { createdAt: 'desc' },
}) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  const [items, totalItems] = await Promise.all([
    model.findMany({
      where,
      skip,
      take: limit,
      include,
      orderBy,
    }),
    model.count({ where }),
  ]);

  const totalPages = Math.ceil(totalItems / limit);

  return {
    items,
    // Provide both naming conventions to prevent frontend field-misses
    totalItems,
    totalPages,
    currentPage: page,
    limit,
    // Aliases for modern UI components
    total: totalItems,
    page: page
  };
};
