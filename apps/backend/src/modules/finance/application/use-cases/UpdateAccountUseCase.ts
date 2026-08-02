import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import {
  AccountCyclicHierarchyException,
  AccountNotFoundException,
  AccountParentNotFoundException,
  AccountTypeNormalBalanceMismatchException,
} from '../../domain/exceptions/FinanceExceptions';
import { IAccountRepository } from '../../domain/repositories/IAccountRepository';
import { toAccountResponseDto, toPrismaAccountType, toPrismaNormalBalance } from '../mappers/AccountMapper';
import { AccountResponseDto } from '../dtos/AccountResponseDto';

const DEBIT_NORMAL_TYPES = new Set(['asset', 'expense']);
const CREDIT_NORMAL_TYPES = new Set(['liability', 'equity', 'revenue']);

export interface UpdateAccountInput {
  accountId: string;
  name?: string;
  accountType?: string;
  normalBalance?: string;
  parentId?: string;
  isPostable?: boolean;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-145.md. task-145's AC that accountType/normalBalance
 * become immutable "after any journal has posted against the account"
 * cannot yet be checked here -- `JournalDetail` (the table that would
 * prove posting history) doesn't exist until Epic AC. Until then no
 * journal can possibly reference any account, so there is nothing to
 * violate; that guard is added in Epic AC once JournalDetail exists to
 * query, the same deferred-but-documented pattern used for
 * StockTransaction.batchId across Epic V->Y.
 */
export class UpdateAccountUseCase {
  constructor(
    private readonly accountRepository: IAccountRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: UpdateAccountInput): Promise<AccountResponseDto> {
    const existing = await this.accountRepository.findById(input.accountId);
    if (!existing) {
      throw new AccountNotFoundException();
    }

    const accountType = input.accountType ?? existing.accountType.toLowerCase();
    const normalBalance = input.normalBalance ?? existing.normalBalance.toLowerCase();
    const expectedNormalBalance = DEBIT_NORMAL_TYPES.has(accountType) ? 'debit' : CREDIT_NORMAL_TYPES.has(accountType) ? 'credit' : null;
    if (expectedNormalBalance && normalBalance !== expectedNormalBalance) {
      throw new AccountTypeNormalBalanceMismatchException(accountType, expectedNormalBalance);
    }

    if (input.parentId) {
      if (input.parentId === input.accountId) {
        throw new AccountCyclicHierarchyException();
      }
      let cursor = await this.accountRepository.findById(input.parentId);
      if (!cursor) {
        throw new AccountParentNotFoundException();
      }
      while (cursor.parentId) {
        if (cursor.parentId === input.accountId) {
          throw new AccountCyclicHierarchyException();
        }
        cursor = await this.accountRepository.findById(cursor.parentId);
        if (!cursor) break;
      }
    }

    const updated = await this.accountRepository.update(input.accountId, {
      name: input.name,
      accountType: input.accountType ? toPrismaAccountType(input.accountType) : undefined,
      normalBalance: input.normalBalance ? toPrismaNormalBalance(input.normalBalance) : undefined,
      parentId: input.parentId,
      isPostable: input.isPostable,
      updatedBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record('Account', input.accountId, 'UPDATE', existing, updated, auditContext);

    return toAccountResponseDto(updated);
  }
}
