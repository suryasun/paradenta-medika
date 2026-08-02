import { NextFunction, Request, RequestHandler, Response } from 'express';
import { sendError } from '../http/ApiResponse';

/**
 * In-memory fixed-window rate limiter. docs/04-ai-contract/09-security-contract.md
 * SEC-075: exact rate-limit storage MUST be treated as NOT DEFINED IN SAD, so
 * an in-memory store is a reasonable default for the Phase 1 monolith.
 * SEC-074: a breach MUST return HTTP 429.
 */
export function rateLimiter(maxRequests: number, windowMs: number): RequestHandler {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip ?? 'unknown';
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (entry.count >= maxRequests) {
      sendError(res, 429, 'RATE_LIMIT_EXCEEDED', 'Too many requests, please try again later', [], req.correlationId);
      return;
    }

    entry.count += 1;
    next();
  };
}
