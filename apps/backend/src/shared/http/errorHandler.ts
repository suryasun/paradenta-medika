import { NextFunction, Request, Response } from 'express';
import { ApplicationException } from './exceptions';
import { sendError } from './ApiResponse';
import { logger } from '../logging/logger';

/**
 * Centralized Exception Handler per docs/03-sad/03-clean-architecture.md
 * Section 38: maps the ApplicationException hierarchy to HTTP status codes
 * (Section 38.5) and never leaks stack traces, SQL, or Prisma errors to the
 * client (Section 38.4 / docs/04-ai-contract/09-security-contract.md SEC-042).
 */
export function errorHandlerMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
): void {
  const correlationId = req.correlationId;

  if (err instanceof ApplicationException) {
    logger.warn('Handled application exception', {
      correlationId,
      module: 'error-handler',
      code: err.code,
      httpStatus: err.httpStatus,
    });
    sendError(res, err.httpStatus, err.code, err.message, err.errors, correlationId);
    return;
  }

  const rawMessage = err instanceof Error ? err.message : String(err);
  const rawStack = err instanceof Error ? err.stack : undefined;
  logger.error('Unhandled exception', {
    correlationId,
    module: 'error-handler',
    rawMessage,
    rawStack,
  });

  sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Internal server error', [], correlationId);
}

/**
 * 404 fallback for routes that do not match any registered handler.
 */
export function notFoundMiddleware(req: Request, res: Response): void {
  sendError(res, 404, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`, [], req.correlationId);
}
