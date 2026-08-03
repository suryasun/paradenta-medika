import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import {
  CashAccountNotFoundException,
  DoctorFeeSettlementNotFoundException,
  FinancialPeriodClosedException,
  SettlementNotApprovedException,
} from '../../domain/exceptions/FinanceExceptions';
import { ICashAccountRepository } from '../../domain/repositories/ICashAccountRepository';
import { IDoctorFeeSettlementRepository } from '../../domain/repositories/IDoctorFeeSettlementRepository';
import { IFinancialPeriodRepository } from '../../domain/repositories/IFinancialPeriodRepository';
import { IJournalRepository } from '../../domain/repositories/IJournalRepository';
import { JournalNumberGenerator } from '../services/JournalNumberGenerator';
import { DoctorFeeSettlementResponseDto } from '../dtos/DoctorFeeSettlementResponseDto';
import { toDoctorFeeSettlementResponseDto } from '../mappers/DoctorFeeSettlementMapper';

export interface PayDoctorFeeSettlementInput {
  settlementId: string;
  cashAccountId: string;
  paymentDate: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

const SYSTEM_ACTOR = 'system:doctor-fee-settlement';

/**
 * docs/06-tasks/task-167.md AC: "Pay rejected unless settlement is
 * approved" (`FIN_SETTLEMENT_NOT_APPROVED`); "Resulting Journal is
 * balanced." Posts Debit feeAccount / Credit cashAccount's ledger
 * account (Section 3.6's doctor-fee-payment template, collapsed to a
 * single posting per the schema's own doc comment), mirroring
 * PayExpenseUseCase's system-posting pattern exactly.
 */
export class PayDoctorFeeSettlementUseCase {
  constructor(
    private readonly settlementRepository: IDoctorFeeSettlementRepository,
    private readonly cashAccountRepository: ICashAccountRepository,
    private readonly journalRepository: IJournalRepository,
    private readonly financialPeriodRepository: IFinancialPeriodRepository,
    private readonly numberGenerator: JournalNumberGenerator,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: PayDoctorFeeSettlementInput): Promise<DoctorFeeSettlementResponseDto> {
    const settlement = await this.settlementRepository.findById(input.settlementId);
    if (!settlement) {
      throw new DoctorFeeSettlementNotFoundException();
    }
    if (settlement.status !== 'APPROVED') {
      throw new SettlementNotApprovedException();
    }

    const cashAccount = await this.cashAccountRepository.findById(input.cashAccountId);
    if (!cashAccount) {
      throw new CashAccountNotFoundException();
    }

    const paymentDate = new Date(input.paymentDate);
    const openPeriod = await this.financialPeriodRepository.findOpenPeriodForDate(settlement.branchId, paymentDate);
    if (!openPeriod) {
      throw new FinancialPeriodClosedException();
    }

    const netAmount = Number(settlement.netAmount);
    const journalNo = await this.numberGenerator.generate(paymentDate);
    const description = `Payment of doctor fee settlement ${settlement.settlementNo}`;
    const journal = await this.journalRepository.createPosted({
      journalNo,
      branchId: settlement.branchId,
      journalDate: paymentDate,
      description,
      referenceType: 'DOCTOR_FEE_SETTLEMENT',
      referenceId: settlement.id,
      postingType: 'DOCTOR_FEE_SETTLEMENT',
      lines: [
        { accountId: settlement.feeAccountId, debit: netAmount, credit: 0, description },
        { accountId: cashAccount.ledgerAccountId, debit: 0, credit: netAmount, description },
      ],
      createdBy: input.actorUserId,
      postedBy: SYSTEM_ACTOR,
    });

    await this.cashAccountRepository.adjustBalance(cashAccount.id, -netAmount);

    const paid = await this.settlementRepository.markPaid(input.settlementId, input.actorUserId, new Date(), journal.id);

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'DoctorFeeSettlement',
      input.settlementId,
      'UPDATE',
      { status: 'APPROVED' },
      { status: 'PAID', netAmount, journalId: journal.id },
      auditContext,
    );

    return toDoctorFeeSettlementResponseDto(paid);
  }
}
