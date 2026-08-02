/**
 * docs/04-ai-contract/04-api-contract.md API-059: paginated responses place
 * page/limit/total/totalPages in `meta`.
 */
export interface PaginationMeta {
  [key: string]: number;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export interface PagedResult<T> {
  items: T[];
  total: number;
}

/**
 * docs/04-ai-contract/04-api-contract.md API-071: allowed sort fields MUST
 * be explicitly defined by the endpoint contract; an unlisted field falls
 * back to the default rather than being passed through to the ORM.
 */
export function sanitizeSortField(requested: string, allowed: readonly string[], fallback = 'createdAt'): string {
  return allowed.includes(requested) ? requested : fallback;
}
