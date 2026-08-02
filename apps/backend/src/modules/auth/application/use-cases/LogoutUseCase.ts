import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { ISessionRepository } from '../../domain/repositories/ISessionRepository';

export interface LogoutInput {
  sessionId: string;
  userId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-009.md: revoke the current session (identified by the
 * authenticated request's sessionId claim, not a re-submitted refresh
 * token), record the logout activity in the Audit Trail (AUTH-045..047).
 */
export class LogoutUseCase {
  constructor(
    private readonly sessionRepository: ISessionRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: LogoutInput): Promise<void> {
    await this.sessionRepository.revoke(input.sessionId);

    const auditContext: AuditContext = {
      userId: input.userId,
      ipAddress: input.ipAddress,
      correlationId: input.correlationId,
    };
    await this.auditService.record('UserSession', input.sessionId, 'UPDATE', null, { action: 'LOGOUT' }, auditContext);
  }
}
