import { NextFunction, Request, Response } from 'express';
import { logger } from './logger';

/**
 * Access log per docs/03-sad/03-clean-architecture.md Section 36.3 (Access
 * Log) and Section 21.5 fields of docs/03-sad/02-system-architecture.md.
 */
export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    logger.info('HTTP request handled', {
      correlationId: req.correlationId,
      module: 'access-log',
      httpMethod: req.method,
      endpoint: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs),
      ipAddress: req.ip,
    });
  });

  next();
}
