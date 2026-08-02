import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import {
  AccountCodeExistsException,
  AccountParentNotFoundException,
  AccountTypeNormalBalanceMismatchException,
} from '../../domain/exceptions/FinanceExceptions';
import { IAccountRepository } from '../../domain/repositories/IAccountRepository';
import { toAccountResponseDto, toPrismaAccountType, toPrismaNormalBalance } from '../mappers/AccountMapper';
import { AccountResponseDto } from '../dtos/AccountResponseDto';

const DEBIT_NORMAL_TYPES = new Set(['asset', 'expense']);
const CREDIT_NORMAL_TYPES = new Set(['liability', 'equity', 'revenue']);

export interface CreateAccountInput {
  branchId?: string;
  code: string;
  name: string;
  accountType: string;
  normalBalance: string;
  parentId?: string;
  isPostable: boolean;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-143.md/task-144.md; docs/03-sad/17-module-finance.md
 * Section 6.1. Enforces accountType/normalBalance consistency (task-143
 * AC: asset/expense = debit-normal, liability/equity/revenue = credit-
 * normal), rejects a duplicate code within the (branchId, code) scope --
 * checked explicitly since MySQL's NULL-distinct unique-index behavior
 * can't catch two shared-template accounts sharing a code -- and rejects
 * a cyclic parent hierarchy (Section 5.2: "no cyclic hierarchy").
 */
export class CreateAccountUseCase {
  constructor(
    private readonly accountRepository: IAccountRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: CreateAccountInput): Promise<AccountResponseDto> {
    const expectedNormalBalance = DEBIT_NORMAL_TYPES.has(input.accountType)
      ? 'debit'
      : CREDIT_NORMAL_TYPES.has(input.accountType)
        ? 'credit'
        : null;
    if (expectedNormalBalance && input.normalBalance !== expectedNormalBalance) {
      throw new AccountTypeNormalBalanceMismatchException(input.accountType, expectedNormalBalance);
    }

    const existing = await this.accountRepository.findByBranchAndCode(input.branchId ?? null, input.code);
    if (existing) {
      throw new AccountCodeExistsException();
    }

    if (input.parentId) {
      const parent = await this.accountRepository.findById(input.parentId);
      if (!parent) {
        throw new AccountParentNotFoundException();
      }
      // A brand-new account has no id yet and no descendants, so no cycle can be introduced at creation time --
      // only UpdateAccountUseCase (reparenting an existing account) needs the ancestor-chain cycle check.
    }

    const account = await this.accountRepository.create({
      branchId: input.branchId ?? null,
      code: input.code,
      name: input.name,
      accountType: toPrismaAccountType(input.accountType),
      normalBalance: toPrismaNormalBalance(input.normalBalance),
      parentId: input.parentId ?? null,
      isPostable: input.isPostable,
      createdBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'Account',
      account.id,
      'CREATE',
      null,
      { code: input.code, name: input.name, accountType: input.accountType, normalBalance: input.normalBalance },
      auditContext,
    );

    return toAccountResponseDto(account);
  }
}
