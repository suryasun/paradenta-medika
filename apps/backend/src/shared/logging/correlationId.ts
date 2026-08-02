import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const CORRELATION_ID_HEADER = 'X-Correlation-ID';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      correlationId: string;
    }
  }
}

/**
 * docs/03-sad/03-clean-architecture.md Section 36.4: every request carries a
 * Correlation ID. docs/04-ai-contract/04-api-contract.md API-046: clients MAY
 * send X-Correlation-ID; its absence MUST NOT be treated as a validation
 * error, so one is generated when the client omits it.
 */
export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header(CORRELATION_ID_HEADER);
  const correlationId = incoming && incoming.trim() !== '' ? incoming : uuidv4();
  req.correlationId = correlationId;
  res.setHeader(CORRELATION_ID_HEADER, correlationId);
  next();
}
