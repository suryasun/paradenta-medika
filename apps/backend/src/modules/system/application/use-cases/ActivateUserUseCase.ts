import { User } from '@prisma/client';
import { AuditContext, IAuditService } from '../../domain/services/IAuditService';
import { IUserAdminRepository } from '../../domain/repositories/IUserAdminRepository';
import { UserNotFoundException } from '../../domain/exceptions/SystemExceptions';

export interface ActivateUserInput {
  userId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

export class ActivateUserUseCase {
  constructor(
    private readonly userAdminRepository: IUserAdminRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: ActivateUserInput): Promise<User> {
    const existing = await this.userAdminRepository.findById(input.userId);
    if (!existing) {
      throw new UserNotFoundException();
    }

    const updated = await this.userAdminRepository.setStatus(input.userId, 'ACTIVE');

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record('User', updated.id, 'UPDATE', { status: existing.status }, { status: 'ACTIVE' }, auditContext);

    return updated;
  }
}
