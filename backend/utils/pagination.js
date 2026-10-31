/**
 * Validates and parses query parameters for pagination.
 * Ensures page and limit are strictly positive integers (>= 1).
 * Rejects decimal numbers (e.g. 1.5), non-numeric strings ('abc'), and zero or negative values with an error message.
 */
export const parsePaginationParams = (query, defaultLimit = 20, maxLimit = 100) => {
  const { page, limit } = query;

  if (page !== undefined) {
    const pageStr = String(page).trim();
    if (!/^\d+$/.test(pageStr) || parseInt(pageStr, 10) < 1) {
      return { error: 'Page parameter must be a positive integer greater than or equal to 1' };
    }
  }

  if (limit !== undefined) {
    const limitStr = String(limit).trim();
    if (!/^\d+$/.test(limitStr) || parseInt(limitStr, 10) < 1) {
      return { error: 'Limit parameter must be a positive integer greater than or equal to 1' };
    }
  }

  const pageNum = page !== undefined ? parseInt(String(page).trim(), 10) : 1;
  const limitNum = Math.min(
    limit !== undefined ? parseInt(String(limit).trim(), 10) : defaultLimit,
    maxLimit
  );
  const skip = (pageNum - 1) * limitNum;

  return { pageNum, limitNum, skip };
};

export default parsePaginationParams;
