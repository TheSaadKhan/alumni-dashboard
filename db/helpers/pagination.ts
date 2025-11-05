export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export const createPagination = (page: number = 1, pageSize: number = 10): { from: number; to: number } => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { from, to };
};

export const buildPaginatedResponse = <T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedResponse<T> => {
  const totalPages = Math.ceil(total / pageSize);
  return {
    data,
    total,
    page,
    pageSize,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

// Helper for Supabase range queries
export const applyPagination = (query: any, pagination: PaginationParams) => {
  const { from, to } = createPagination(pagination.page, pagination.pageSize);
  return query.range(from, to);
};

// Calculate offset for cursor-based pagination
export const createCursorPagination = (cursor: string | null, limit: number = 10) => {
  return {
    cursor,
    limit,
  };
};