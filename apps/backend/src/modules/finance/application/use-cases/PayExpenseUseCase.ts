import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import {
  CashAccountNotFoundException,
  ExpenseNotApprovedException,
  ExpenseNotFoundException,
  ExpensePaymentExceedsApprovedException,
  FinancialPeriodClosedException,
} from '../../domain/exceptions/FinanceExceptions';
import { ICashAccountRepository } from '../../domain/repositories/ICashAccountRepository';
import { IExpenseRepository } from '../../domain/repositories/IExpenseRepository';
import { IFinancialPeriodRepository } from '../../domain/repositories/IFinancialPeriodRepository';
import { IJournalRepository } from '../../domain/repositories/IJournalRepository';
import { JournalNumberGenerator } from '../services/JournalNumberGenerator';
import { ExpenseResponseDto } from '../dtos/ExpenseResponseDto';
import { toExpenseResponseDto } from '../mappers/ExpenseMapper';

export interface PayExpenseInput {
  expenseId: string;
  cashAccountId: string;
  paymentDate: string;
  amount: number;
  referenceNo?: string;
  note?: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

const SYSTEM_ACTOR = 'system:expense-payment';

/**
 * docs/06-tasks/task-161.md; docs/03-sad/17-module-finance.md UC-FIN-003
 * step 4 / Section 3.6 posting template ("Expense payment: Debit expense
 * account, Credit cash/bank or accounts payable"). Requires `APPROVED`
 * status (`FIN_EXPENSE_NOT_APPROVED`), enforces the Section 3.3 invariant
 * that paid amount cannot exceed approved amount
 * (`FIN_EXPENSE_PAYMENT_EXCEEDS_APPROVED`), and posts an already-posted
 * system journal the same way Cash Transfer does (see
 * `IJournalRepository.createPosted`'s doc comment).
 */
export class PayExpenseUseCase {
  constructor(
    private readonly expenseRepository: IExpenseRepository,
    private readonly cashAccountRepository: ICashAccountRepository,
    private readonly journalRepository: IJournalRepository,
    private readonly financialPeriodRepository: IFinancialPeriodRepository,
    private readonly numberGenerator: JournalNumberGenerator,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: PayExpenseInput): Promise<ExpenseResponseDto> {
    const expense = await this.expenseRepository.findById(input.expenseId);
    if (!expense) {
      throw new ExpenseNotFoundException();
    }
    if (expense.status !== 'APPROVED') {
      throw new ExpenseNotApprovedException();
    }

    const approvedAmount = expense.approvedAmount !== null ? Number(expense.approvedAmount) : Number(expense.amount);
    if (input.amount > approvedAmount) {
      throw new ExpensePaymentExceedsApprovedException();
    }

    const cashAccount = await this.cashAccountRepository.findById(input.cashAccountId);
    if (!cashAccount) {
      throw new CashAccountNotFoundException();
    }

    const paymentDate = new Date(input.paymentDate);
    const openPeriod = await this.financialPeriodRepository.findOpenPeriodForDate(expense.branchId, paymentDate);
    if (!openPeriod) {
      throw new FinancialPeriodClosedException();
    }

    const journalNo = await this.numberGenerator.generate(paymentDate);
    const description = input.note ?? `Payment of expense ${expense.expenseNo}`;
    const journal = await this.journalRepository.createPosted({
      journalNo,
      branchId: expense.branchId,
      journalDate: paymentDate,
      description,
      referenceType: 'EXPENSE_PAYMENT',
      referenceId: expense.id,
      postingType: 'EXPENSE_PAYMENT',
      lines: [
        { accountId: expense.expenseAccountId, debit: input.amount, credit: 0, description },
        { accountId: cashAccount.ledgerAccountId, debit: 0, credit: input.amount, description: input.referenceNo },
      ],
      createdBy: input.actorUserId,
      postedBy: SYSTEM_ACTOR,
    });

    await this.cashAccountRepository.adjustBalance(cashAccount.id, -input.amount);

    const paid = await this.expenseRepository.updateStatus(input.expenseId, 'PAID', {
      paidBy: input.actorUserId,
      paidAt: new Date(),
      paidAmount: input.amount,
      paymentJournalId: journal.id,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'Expense',
      input.expenseId,
      'UPDATE',
      { status: 'APPROVED' },
      { status: 'PAID', paidAmount: input.amount, journalId: journal.id },
      auditContext,
    );

    return toExpenseResponseDto(paid);
  }
}
