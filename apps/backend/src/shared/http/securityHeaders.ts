import { NextFunction, Request, Response } from 'express';

/**
 * docs/04-ai-contract/09-security-contract.md SEC-093: responses MUST
 * include Permissions-Policy. Helmet (mounted separately in app.ts) covers
 * SEC-088..SEC-092 (HSTS, CSP, X-Frame-Options, X-Content-Type-Options,
 * Referrer-Policy) but does not set Permissions-Policy by default.
 */
export function permissionsPolicyMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  next();
}
