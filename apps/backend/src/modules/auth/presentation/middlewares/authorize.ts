import { NextFunction, Request, RequestHandler, Response } from 'express';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { InsufficientPermissionException } from '../../domain/exceptions/AuthExceptions';
import { IAuditService } from '../../../system/domain/services/IAuditService';

/**
 * docs/06-tasks/task-014.md: middleware factory checking the authenticated
 * user's resolved permissions include the required permission code
 * (docs/03-sad/09-api-standard.md dot-notation, e.g. `patient.create`).
 * Must run after createAuthenticateMiddleware (task-013).
 */
export function requirePermission(permissionCode: string, auditService: IAuditService): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.auth) {
      next(new AuthenticationException());
      return;
    }

    if (!req.auth.permissionKeys.includes(permissionCode)) {
      await auditService.record(
        'Authorization',
        req.auth.userId,
        'UPDATE',
        null,
        { deniedPermission: permissionCode, endpoint: req.originalUrl },
        { userId: req.auth.userId, ipAddress: req.ip, correlationId: req.correlationId },
      );
      next(new InsufficientPermissionException(permissionCode));
      return;
    }

    next();
  };
}
