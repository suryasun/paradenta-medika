import { Router } from 'express';
import { ConfigService } from '../../../../shared/config/ConfigService';
import { validateBody } from '../../../../shared/http/validateBody';
import { rateLimiter } from '../../../../shared/security/rateLimiter';
import { IAuditService } from '../../../system/domain/services/IAuditService';
import { LoginRequestDto } from '../../application/dtos/LoginRequestDto';
import { RefreshTokenRequestDto } from '../../application/dtos/RefreshTokenRequestDto';
import { ChangePasswordRequestDto } from '../../application/dtos/ChangePasswordRequestDto';
import { ForgotPasswordRequestDto } from '../../application/dtos/ForgotPasswordRequestDto';
import { ResetPasswordRequestDto } from '../../application/dtos/ResetPasswordRequestDto';
import { JwtService } from '../../application/services/JwtService';
import { PasswordService } from '../../application/services/PasswordService';
import { LoginUseCase } from '../../application/use-cases/LoginUseCase';
import { RefreshTokenUseCase } from '../../application/use-cases/RefreshTokenUseCase';
import { LogoutUseCase } from '../../application/use-cases/LogoutUseCase';
import { ChangePasswordUseCase } from '../../application/use-cases/ChangePasswordUseCase';
import { ForgotPasswordUseCase } from '../../application/use-cases/ForgotPasswordUseCase';
import { ResetPasswordUseCase } from '../../application/use-cases/ResetPasswordUseCase';
import { PasswordResetTokenRepository } from '../../infrastructure/repositories/PasswordResetTokenRepository';
import { SessionRepository } from '../../infrastructure/repositories/SessionRepository';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { LoggingEmailSender } from '../../infrastructure/services/LoggingEmailSender';
import { AuthController } from '../controllers/AuthController';
import { createAuthenticateMiddleware } from '../middlewares/authenticate';
import { requirePermission } from '../middlewares/authorize';

/**
 * docs/06-tasks/task-007.md..task-014.md composition root for the
 * Authentication module: wires repositories, services, use cases, and
 * exposes both the /api/v1/auth router and the reusable authenticate
 * middleware (task-013) for every other module's routes.
 */
export function buildAuthModule(config: ConfigService, auditService: IAuditService) {
  const userRepository = new UserRepository();
  const sessionRepository = new SessionRepository();
  const passwordResetTokenRepository = new PasswordResetTokenRepository();

  const passwordService = new PasswordService(config);
  const jwtService = new JwtService(config);
  const emailSender = new LoggingEmailSender();

  const loginUseCase = new LoginUseCase(userRepository, sessionRepository, passwordService, jwtService, auditService, config);
  const refreshTokenUseCase = new RefreshTokenUseCase(userRepository, sessionRepository, jwtService, auditService, config);
  const logoutUseCase = new LogoutUseCase(sessionRepository, auditService);
  const changePasswordUseCase = new ChangePasswordUseCase(userRepository, sessionRepository, passwordService, auditService);
  const forgotPasswordUseCase = new ForgotPasswordUseCase(userRepository, passwordResetTokenRepository, emailSender);
  const resetPasswordUseCase = new ResetPasswordUseCase(
    userRepository,
    passwordResetTokenRepository,
    sessionRepository,
    passwordService,
    auditService,
  );

  const controller = new AuthController(
    loginUseCase,
    refreshTokenUseCase,
    logoutUseCase,
    changePasswordUseCase,
    forgotPasswordUseCase,
    resetPasswordUseCase,
  );

  const authenticate = createAuthenticateMiddleware(jwtService, sessionRepository, userRepository);

  const router = Router();
  // docs/04-ai-contract/09-security-contract.md SEC-068: login 5/min. SEC-069: refresh 20/min.
  router.post('/auth/login', rateLimiter(5, 60_000), validateBody(LoginRequestDto), controller.login);
  router.post('/auth/refresh', rateLimiter(20, 60_000), validateBody(RefreshTokenRequestDto), controller.refresh);
  router.post('/auth/logout', authenticate, controller.logout);
  router.post('/auth/change-password', authenticate, validateBody(ChangePasswordRequestDto), controller.changePassword);
  router.post('/auth/forgot-password', validateBody(ForgotPasswordRequestDto), controller.forgotPassword);
  router.post('/auth/reset-password', validateBody(ResetPasswordRequestDto), controller.resetPassword);

  const requirePermissionFor = (permissionCode: string) => requirePermission(permissionCode, auditService);

  return { router, authenticate, requirePermission: requirePermissionFor, jwtService, sessionRepository, userRepository };
}
