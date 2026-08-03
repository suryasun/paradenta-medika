import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { IPaymentMethodRepository } from '../../../master-data/domain/repositories/IPaymentMethodRepository';
import { MasterDataNotFoundException } from '../../../master-data/domain/exceptions/MasterDataExceptions';
import { AccountMappingAlreadyExistsException, AccountNotFoundException, CashAccountNotFoundException } from '../../domain/exceptions/FinanceExceptions';
import { IAccountRepository } from '../../domain/repositories/IAccountRepository';
import { ICashAccountRepository } from '../../domain/repositories/ICashAccountRepository';
import { IFinanceAccountMappingRepository } from '../../domain/repositories/IFinanceAccountMappingRepository';
import { FinanceAccountMappingResponseDto } from '../dtos/FinanceAccountMappingResponseDto';
import { toFinanceAccountMappingResponseDto } from '../mappers/FinanceAccountMappingMapper';

export interface CreateFinanceAccountMappingInput {
  branchId: string;
  paymentMethodId: string;
  cashAccountId: string;
  revenueAccountId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-162.md Deliverable: "Account-mapping configuration
 * lookup" needs an admin-facing configuration surface to populate, since
 * no seed/migration data can know a real clinic's chart of accounts.
 * docs/03-sad/17-module-finance.md line 248 ("Maintain COA mapping") is a
 * Finance-Manager/Administrator-only Actor Matrix row.
 */
export class CreateFinanceAccountMappingUseCase {
  constructor(
    private readonly accountMappingRepository: IFinanceAccountMappingRepository,
    private readonly paymentMethodRepository: IPaymentMethodRepository,
    private readonly cashAccountRepository: ICashAccountRepository,
    private readonly accountRepository: IAccountRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: CreateFinanceAccountMappingInput): Promise<FinanceAccountMappingResponseDto> {
    const paymentMethod = await this.paymentMethodRepository.findById(input.paymentMethodId);
    if (!paymentMethod) {
      throw new MasterDataNotFoundException('PaymentMethod');
    }

    const cashAccount = await this.cashAccountRepository.findById(input.cashAccountId);
    if (!cashAccount) {
      throw new CashAccountNotFoundException();
    }

    const revenueAccount = await this.accountRepository.findById(input.revenueAccountId);
    if (!revenueAccount) {
      throw new AccountNotFoundException();
    }

    const existing = await this.accountMappingRepository.findByBranchAndPaymentMethod(input.branchId, input.paymentMethodId);
    if (existing) {
      throw new AccountMappingAlreadyExistsException();
    }

    const mapping = await this.accountMappingRepository.create({
      branchId: input.branchId,
      paymentMethodId: input.paymentMethodId,
      cashAccountId: input.cashAccountId,
      revenueAccountId: input.revenueAccountId,
      createdBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'FinanceAccountMapping',
      mapping.id,
      'CREATE',
      null,
      { branchId: input.branchId, paymentMethodId: input.paymentMethodId, cashAccountId: input.cashAccountId, revenueAccountId: input.revenueAccountId },
      auditContext,
    );

    return toFinanceAccountMappingResponseDto(mapping);
  }
}
