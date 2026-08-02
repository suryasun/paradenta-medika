import { User } from '@prisma/client';
import { AuditContext, IAuditService } from '../../domain/services/IAuditService';
import { IUserAdminRepository } from '../../domain/repositories/IUserAdminRepository';
import { UserIdentifierExistsException, UserNotFoundException } from '../../domain/exceptions/SystemExceptions';

export interface UpdateUserInput {
  userId: string;
  email: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

export class UpdateUserUseCase {
  constructor(
    private readonly userAdminRepository: IUserAdminRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: UpdateUserInput): Promise<User> {
    const existing = await this.userAdminRepository.findById(input.userId);
    if (!existing) {
      throw new UserNotFoundException();
    }

    if (existing.email !== input.email) {
      const conflict = await this.userAdminRepository.existsByUsernameOrEmail(existing.username, input.email, existing.id);
      if (conflict) {
        throw new UserIdentifierExistsException();
      }
    }

    const updated = await this.userAdminRepository.updateEmail(input.userId, input.email);

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record('User', updated.id, 'UPDATE', { email: existing.email }, { email: updated.email }, auditContext);

    return updated;
  }
}
