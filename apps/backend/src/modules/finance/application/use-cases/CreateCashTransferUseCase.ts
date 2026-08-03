import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import {
  CashAccountNotFoundException,
  CashTransferCrossBranchException,
  CashTransferSourceDestinationSameException,
  FinancialPeriodClosedException,
} from '../../domain/exceptions/FinanceExceptions';
import { ICashAccountRepository } from '../../domain/repositories/ICashAccountRepository';
import { IFinancialPeriodRepository } from '../../domain/repositories/IFinancialPeriodRepository';
import { IJournalRepository } from '../../domain/repositories/IJournalRepository';
import { JournalNumberGenerator } from '../services/JournalNumberGenerator';
import { JournalResponseDto } from '../dtos/JournalResponseDto';
import { toJournalResponseDto } from '../mappers/JournalMapper';

export interface CreateCashTransferInput {
  transferDate: string;
  sourceCashAccountId: string;
  destinationCashAccountId: string;
  amount: number;
  description?: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

const SYSTEM_ACTOR = 'system:cash-transfer';

/**
 * docs/06-tasks/task-155.md; docs/03-sad/17-module-finance.md UC-FIN-004
 * / Section 3.6 posting template ("Cash transfer: Debit destination
 * cash/bank, Credit source cash/bank"). Creates an already-posted system
 * journal (see `IJournalRepository.createPosted`'s doc comment for why
 * this bypasses the manual-journal maker-checker check) and updates both
 * `CashAccount.currentBalance` atomically with the posting. Cross-branch
 * transfers (which UC-FIN-004 says require inter-branch clearing
 * accounts and Finance Manager approval) are out of this task's scope --
 * rejected rather than silently mishandled.
 */
export class CreateCashTransferUseCase {
  constructor(
    private readonly cashAccountRepository: ICashAccountRepository,
    private readonly journalRepository: IJournalRepository,
    private readonly financialPeriodRepository: IFinancialPeriodRepository,
    private readonly numberGenerator: JournalNumberGenerator,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: CreateCashTransferInput): Promise<JournalResponseDto> {
    if (input.sourceCashAccountId === input.destinationCashAccountId) {
      throw new CashTransferSourceDestinationSameException();
    }

    const source = await this.cashAccountRepository.findById(input.sourceCashAccountId);
    const destination = await this.cashAccountRepository.findById(input.destinationCashAccountId);
    if (!source || !destination) {
      throw new CashAccountNotFoundException();
    }
    if (source.branchId !== destination.branchId) {
      throw new CashTransferCrossBranchException();
    }

    const transferDate = new Date(input.transferDate);
    const openPeriod = await this.financialPeriodRepository.findOpenPeriodForDate(source.branchId, transferDate);
    if (!openPeriod) {
      throw new FinancialPeriodClosedException();
    }

    const journalNo = await this.numberGenerator.generate(transferDate);
    const description = input.description ?? `Cash transfer from ${source.code} to ${destination.code}`;
    const journal = await this.journalRepository.createPosted({
      journalNo,
      branchId: source.branchId,
      journalDate: transferDate,
      description,
      referenceType: 'CASH_TRANSFER',
      lines: [
        { accountId: destination.ledgerAccountId, debit: input.amount, credit: 0, description },
        { accountId: source.ledgerAccountId, debit: 0, credit: input.amount, description },
      ],
      createdBy: input.actorUserId,
      postedBy: SYSTEM_ACTOR,
    });

    await this.cashAccountRepository.adjustBalance(source.id, -input.amount);
    await this.cashAccountRepository.adjustBalance(destination.id, input.amount);

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'CashTransfer',
      journal.id,
      'CREATE',
      null,
      { sourceCashAccountId: source.id, destinationCashAccountId: destination.id, amount: input.amount },
      auditContext,
    );

    return toJournalResponseDto(journal);
  }
}
