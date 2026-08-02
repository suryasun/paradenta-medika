import { User } from '@prisma/client';
import { AuditContext, IAuditService } from '../../domain/services/IAuditService';
import { IUserAdminRepository } from '../../domain/repositories/IUserAdminRepository';
import { ISessionRepository } from '../../../auth/domain/repositories/ISessionRepository';
import { UserNotFoundException } from '../../domain/exceptions/SystemExceptions';

export interface DeactivateUserInput {
  userId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-016.md Security Impact: deactivation MUST revoke all
 * active sessions, not just flip the status flag (AUTH-054).
 */
export class DeactivateUserUseCase {
  constructor(
    private readonly userAdminRepository: IUserAdminRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: DeactivateUserInput): Promise<User> {
    const existing = await this.userAdminRepository.findById(input.userId);
    if (!existing) {
      throw new UserNotFoundException();
    }

    const updated = await this.userAdminRepository.setStatus(input.userId, 'INACTIVE');
    await this.sessionRepository.revokeAllForUser(input.userId);

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record('User', updated.id, 'UPDATE', { status: existing.status }, { status: 'INACTIVE' }, auditContext);

    return updated;
  }
}
