// Mirrors apps/backend/src/shared/http/ApiResponse.ts and pagination.ts exactly
// (docs/04-ai-contract/04-api-contract.md API-048/API-059/API-080).

export interface ApiSuccessBody<T> {
  success: true;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  [key: string]: number;
}

export interface ApiErrorBody {
  success: false;
  code: string;
  message: string;
  errors: Array<{ field?: string; message: string }>;
  correlationId?: string;
}

export interface PagedData<T> {
  items: T[];
  meta: PaginationMeta;
}
