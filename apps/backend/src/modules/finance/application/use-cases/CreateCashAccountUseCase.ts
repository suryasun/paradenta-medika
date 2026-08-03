import { CashAccountType } from '@prisma/client';
import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { AccountMappingMissingException } from '../../domain/exceptions/FinanceExceptions';
import { IAccountRepository } from '../../domain/repositories/IAccountRepository';
import { ICashAccountRepository } from '../../domain/repositories/ICashAccountRepository';
import { CashAccountResponseDto } from '../dtos/CashAccountResponseDto';
import { toCashAccountResponseDto } from '../mappers/CashAccountMapper';

export interface CreateCashAccountInput {
  branchId: string;
  code: string;
  name: string;
  accountType: string;
  ledgerAccountId: string;
  accountNumber?: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

const ACCOUNT_TYPE_TO_PRISMA: Record<string, CashAccountType> = { cash: 'CASH', bank: 'BANK', clearing: 'CLEARING' };

/** docs/06-tasks/task-153.md AC: "Cash account is linked to a valid postable finance_accounts row (FIN_ACCOUNT_MAPPING_MISSING if missing)." */
export class CreateCashAccountUseCase {
  constructor(
    private readonly cashAccountRepository: ICashAccountRepository,
    private readonly accountRepository: IAccountRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: CreateCashAccountInput): Promise<CashAccountResponseDto> {
    const ledgerAccount = await this.accountRepository.findById(input.ledgerAccountId);
    if (!ledgerAccount || !ledgerAccount.isPostable || !ledgerAccount.isActive) {
      throw new AccountMappingMissingException();
    }

    const cashAccount = await this.cashAccountRepository.create({
      branchId: input.branchId,
      code: input.code,
      name: input.name,
      accountType: ACCOUNT_TYPE_TO_PRISMA[input.accountType],
      ledgerAccountId: input.ledgerAccountId,
      accountNumber: input.accountNumber,
      createdBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'CashAccount',
      cashAccount.id,
      'CREATE',
      null,
      { branchId: input.branchId, code: input.code, name: input.name, ledgerAccountId: input.ledgerAccountId },
      auditContext,
    );

    return toCashAccountResponseDto(cashAccount);
  }
}
