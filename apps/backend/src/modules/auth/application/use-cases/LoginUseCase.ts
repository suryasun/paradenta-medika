import { ConfigService } from '../../../../shared/config/ConfigService';
import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { logger } from '../../../../shared/logging/logger';
import { parseDurationToMs } from '../../../../shared/security/durationParser';
import { generateOpaqueToken, hashOpaqueToken } from '../../../../shared/security/opaqueToken';
import { InvalidCredentialsException } from '../../domain/exceptions/AuthExceptions';
import { ISessionRepository } from '../../domain/repositories/ISessionRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { LoginResponseDto } from '../dtos/AuthResponseDtos';
import { JwtService } from '../services/JwtService';
import { PasswordService } from '../services/PasswordService';

/**
 * docs/04-ai-contract/05-auth-contract.md AUTH-068/AUTH-069/AUTH-070
 * (documented defaults; task-004 does not list these as configurable env
 * vars, so the SAD defaults are used as constants).
 */
const LOCK_THRESHOLD = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const REQUIRE_RESET_THRESHOLD = 10;
const ADMIN_REVIEW_THRESHOLD = 20;

export interface LoginInput {
  identifier: string;
  password: string;
  deviceId?: string;
  deviceName?: string;
  deviceType?: string;
  browser?: string;
  ipAddress?: string;
  correlationId?: string;
}

export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly auditService: IAuditService,
    private readonly config: ConfigService,
  ) {}

  async execute(input: LoginInput): Promise<LoginResponseDto> {
    const auditContext: AuditContext = { ipAddress: input.ipAddress, correlationId: input.correlationId };

    const user = await this.userRepository.findByIdentifier(input.identifier);
    if (!user) {
      logger.warn('Login failed: identifier not found', { module: 'auth', correlationId: input.correlationId });
      throw new InvalidCredentialsException();
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      await this.auditService.record('User', user.id, 'UPDATE', null, { loginResult: 'LOCKED' }, auditContext);
      throw new InvalidCredentialsException();
    }

    const passwordValid = await this.passwordService.verify(input.password, user.passwordHash);
    if (!passwordValid || user.status !== 'ACTIVE') {
      const failedCount = await this.userRepository.incrementFailedLoginCount(user.id);

      if (failedCount >= LOCK_THRESHOLD) {
        await this.userRepository.lockUntil(user.id, new Date(Date.now() + LOCK_DURATION_MS));
      }
      if (failedCount >= REQUIRE_RESET_THRESHOLD) {
        await this.userRepository.setRequirePasswordReset(user.id, true);
      }
      if (failedCount >= ADMIN_REVIEW_THRESHOLD) {
        logger.error('Account requires administrator review after repeated failed logins', {
          module: 'auth',
          userId: user.id,
          failedCount,
        });
      }

      await this.auditService.record('User', user.id, 'UPDATE', null, { loginResult: 'FAILED' }, auditContext);
      throw new InvalidCredentialsException();
    }

    const roles = await this.userRepository.getRolesWithPermissions(user.id);
    if (roles.length === 0) {
      await this.auditService.record('User', user.id, 'UPDATE', null, { loginResult: 'NO_ACTIVE_ROLE' }, auditContext);
      throw new InvalidCredentialsException();
    }

    await this.userRepository.resetFailedLoginCount(user.id);
    await this.userRepository.updateLastLoginAt(user.id);

    const refreshToken = generateOpaqueToken();
    const refreshExpiresAt = new Date(Date.now() + parseDurationToMs(this.config.get('jwtRefreshExpiry')));

    const session = await this.sessionRepository.create({
      userId: user.id,
      deviceId: input.deviceId,
      deviceName: input.deviceName,
      deviceType: input.deviceType,
      browser: input.browser,
      ipAddress: input.ipAddress,
      refreshTokenHash: hashOpaqueToken(refreshToken),
      expiredAt: refreshExpiresAt,
    });

    const primaryRole = roles[0];
    const accessToken = this.jwtService.signAccessToken({
      sub: user.id,
      username: user.username,
      role: primaryRole.roleCode,
      sessionId: session.id,
      clinicId: null,
    });

    await this.auditService.record('User', user.id, 'UPDATE', null, { loginResult: 'SUCCESS' }, auditContext);

    const permissions = Array.from(new Set(roles.flatMap((role) => role.permissionKeys)));

    return {
      accessToken,
      refreshToken,
      expiresIn: Math.floor(parseDurationToMs(this.config.get('jwtAccessExpiry')) / 1000),
      user: { id: user.id, username: user.username, email: user.email },
      role: primaryRole.roleCode,
      roles: roles.map((role) => role.roleCode),
      permissions,
    };
  }
}
