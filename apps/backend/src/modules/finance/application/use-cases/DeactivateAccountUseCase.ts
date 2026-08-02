import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { AccountNotFoundException } from '../../domain/exceptions/FinanceExceptions';
import { IAccountRepository } from '../../domain/repositories/IAccountRepository';
import { toAccountResponseDto } from '../mappers/AccountMapper';
import { AccountResponseDto } from '../dtos/AccountResponseDto';

export interface DeactivateAccountInput {
  accountId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/** docs/06-tasks/task-145.md AC: deactivating an account with posted journal history is allowed -- it just becomes non-postable going forward; no hard delete exists. */
export class DeactivateAccountUseCase {
  constructor(
    private readonly accountRepository: IAccountRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: DeactivateAccountInput): Promise<AccountResponseDto> {
    const existing = await this.accountRepository.findById(input.accountId);
    if (!existing) {
      throw new AccountNotFoundException();
    }

    const deactivated = await this.accountRepository.deactivate(input.accountId, input.actorUserId);

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record('Account', input.accountId, 'UPDATE', { isActive: true }, { isActive: false }, auditContext);

    return toAccountResponseDto(deactivated);
  }
}
