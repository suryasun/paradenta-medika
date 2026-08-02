import { AuditContext, IAuditService } from '../../domain/services/IAuditService';
import { ISessionRepository } from '../../../auth/domain/repositories/ISessionRepository';
import { IUserAdminRepository } from '../../domain/repositories/IUserAdminRepository';
import { UserNotFoundException } from '../../domain/exceptions/SystemExceptions';

export interface RevokeUserSessionsInput {
  userId: string;
  sessionId?: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-020.md + docs/04-ai-contract/05-auth-contract.md
 * AUTH-049: revoke all devices, a selected device, or all sessions.
 */
export class RevokeUserSessionsUseCase {
  constructor(
    private readonly userAdminRepository: IUserAdminRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: RevokeUserSessionsInput): Promise<void> {
    const user = await this.userAdminRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    if (input.sessionId) {
      const session = await this.sessionRepository.findById(input.sessionId);
      if (session && session.userId === input.userId) {
        await this.sessionRepository.revoke(input.sessionId);
      }
    } else {
      await this.sessionRepository.revokeAllForUser(input.userId);
    }

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'User',
      input.userId,
      'UPDATE',
      null,
      { action: 'REVOKE_SESSIONS', sessionId: input.sessionId ?? 'ALL' },
      auditContext,
    );
  }
}
