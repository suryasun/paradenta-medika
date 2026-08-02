import { Response } from 'express';

/**
 * Standard response envelope per docs/04-ai-contract/04-api-contract.md
 * API-048 (success envelope) and API-080 (error envelope).
 */
export interface ApiSuccessBody<T> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorBody {
  success: false;
  code: string;
  message: string;
  errors: Array<{ field?: string; message: string }>;
  correlationId?: string;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'OK',
  status = 200,
  meta?: Record<string, unknown>,
): Response<ApiSuccessBody<T>> {
  const body: ApiSuccessBody<T> = { success: true, message, data };
  if (meta) {
    body.meta = meta;
  }
  return res.status(status).json(body);
}

export function sendError(
  res: Response,
  status: number,
  code: string,
  message: string,
  errors: Array<{ field?: string; message: string }> = [],
  correlationId?: string,
): Response<ApiErrorBody> {
  const body: ApiErrorBody = { success: false, code, message, errors };
  if (correlationId) {
    body.correlationId = correlationId;
  }
  return res.status(status).json(body);
}
