import { NextFunction, Request, RequestHandler, Response } from 'express';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { ISessionRepository } from '../../domain/repositories/ISessionRepository';
import { JwtService } from '../../application/services/JwtService';

export interface AuthenticatedContext {
  userId: string;
  username: string;
  sessionId: string;
  roleCodes: string[];
  permissionKeys: string[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthenticatedContext;
    }
  }
}

/**
 * docs/06-tasks/task-013.md + docs/03-sad/10-authentication.md Section 32:
 * validates JWT signature/expiry, session still active, user still active,
 * role still assigned, before allowing the request to reach the controller.
 */
export function createAuthenticateMiddleware(
  jwtService: JwtService,
  sessionRepository: ISessionRepository,
  userRepository: IUserRepository,
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const header = req.header('Authorization');
      if (!header || !header.startsWith('Bearer ')) {
        throw new AuthenticationException('Missing bearer token');
      }
      const token = header.slice('Bearer '.length).trim();

      let claims;
      try {
        claims = jwtService.verifyAccessToken(token);
      } catch {
        throw new AuthenticationException('Invalid or expired token');
      }

      const session = await sessionRepository.findById(claims.sessionId);
      if (!session || session.revokedAt || session.expiredAt.getTime() <= Date.now()) {
        throw new AuthenticationException('Session has been revoked or expired');
      }

      const user = await userRepository.findById(claims.sub);
      if (!user || user.status !== 'ACTIVE') {
        throw new AuthenticationException('User is inactive');
      }

      const roles = await userRepository.getRolesWithPermissions(user.id);
      if (roles.length === 0) {
        throw new AuthenticationException('User has no active role');
      }

      req.auth = {
        userId: user.id,
        username: user.username,
        sessionId: session.id,
        roleCodes: roles.map((role) => role.roleCode),
        permissionKeys: Array.from(new Set(roles.flatMap((role) => role.permissionKeys))),
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}
