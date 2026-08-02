import { ConfigService } from '../../../../shared/config/ConfigService';
import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { logger } from '../../../../shared/logging/logger';
import { parseDurationToMs } from '../../../../shared/security/durationParser';
import { generateOpaqueToken, hashOpaqueToken } from '../../../../shared/security/opaqueToken';
import { InvalidTokenException } from '../../domain/exceptions/AuthExceptions';
import { ISessionRepository } from '../../domain/repositories/ISessionRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { RefreshTokenResponseDto } from '../dtos/AuthResponseDtos';
import { JwtService } from '../services/JwtService';

export interface RefreshTokenInput {
  refreshToken: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-008.md + docs/04-ai-contract/05-auth-contract.md
 * AUTH-029..AUTH-037: validate, rotate, and detect reuse of refresh tokens.
 */
export class RefreshTokenUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly jwtService: JwtService,
    private readonly auditService: IAuditService,
    private readonly config: ConfigService,
  ) {}

  async execute(input: RefreshTokenInput): Promise<RefreshTokenResponseDto> {
    const presentedHash = hashOpaqueToken(input.refreshToken);
    const auditContext: AuditContext = { ipAddress: input.ipAddress, correlationId: input.correlationId };

    const session = await this.sessionRepository.findActiveByRefreshTokenHash(presentedHash);

    if (!session) {
      const reusedSession = await this.sessionRepository.findByPreviousRefreshTokenHash(presentedHash);
      if (reusedSession && !reusedSession.revokedAt) {
        await this.sessionRepository.revoke(reusedSession.id);
        logger.error('Refresh token reuse detected; session revoked', {
          module: 'auth',
          sessionId: reusedSession.id,
          userId: reusedSession.userId,
          correlationId: input.correlationId,
        });
        await this.auditService.record(
          'UserSession',
          reusedSession.id,
          'UPDATE',
          null,
          { securityEvent: 'REFRESH_TOKEN_REUSE_DETECTED' },
          auditContext,
        );
      }
      throw new InvalidTokenException();
    }

    if (session.expiredAt.getTime() <= Date.now()) {
      throw new InvalidTokenException('Refresh token has expired');
    }

    const user = await this.userRepository.findById(session.userId);
    if (!user || user.status !== 'ACTIVE') {
      throw new InvalidTokenException();
    }

    const roles = await this.userRepository.getRolesWithPermissions(user.id);
    if (roles.length === 0) {
      throw new InvalidTokenException();
    }

    const newRefreshToken = generateOpaqueToken();
    const newExpiredAt = new Date(Date.now() + parseDurationToMs(this.config.get('jwtRefreshExpiry')));

    await this.sessionRepository.rotateRefreshToken(
      session.id,
      presentedHash,
      hashOpaqueToken(newRefreshToken),
      newExpiredAt,
    );

    const accessToken = this.jwtService.signAccessToken({
      sub: user.id,
      username: user.username,
      role: roles[0].roleCode,
      sessionId: session.id,
      clinicId: null,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: Math.floor(parseDurationToMs(this.config.get('jwtAccessExpiry')) / 1000),
    };
  }
}
