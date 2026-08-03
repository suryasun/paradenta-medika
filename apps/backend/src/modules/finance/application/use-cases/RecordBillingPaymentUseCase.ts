import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { IInvoiceRepository } from '../../../billing/domain/repositories/IInvoiceRepository';
import { IPaymentRepository } from '../../../billing/domain/repositories/IPaymentRepository';
import { InvoiceNotFoundException, PaymentNotFoundException } from '../../../billing/domain/exceptions/BillingExceptions';
import { AccountMappingMissingException, JournalDuplicatePostingException } from '../../domain/exceptions/FinanceExceptions';
import { IAccountRepository } from '../../domain/repositories/IAccountRepository';
import { ICashAccountRepository } from '../../domain/repositories/ICashAccountRepository';
import { IFinanceAccountMappingRepository } from '../../domain/repositories/IFinanceAccountMappingRepository';
import { IJournalRepository } from '../../domain/repositories/IJournalRepository';
import { JournalNumberGenerator } from '../services/JournalNumberGenerator';

const REFERENCE_TYPE = 'BILLING_PAYMENT';
const POSTING_TYPE = 'BILLING_PAYMENT';
const SYSTEM_ACTOR = 'system:billing-payment';

export interface RecordBillingPaymentInput {
  invoiceId: string;
  paymentIds: string[];
  actorUserId: string;
}

/**
 * docs/06-tasks/task-162.md; docs/03-sad/17-module-finance.md UC-FIN-001
 * "Post Billing Payment": consumes Billing's `PaymentCompleted` event
 * (docs/03-sad/02-system-architecture.md Event Catalog) and posts one
 * system Journal per Payment line -- debiting the mapped cash/bank
 * account, crediting the mapped revenue account -- via the same atomic
 * `createPosted` primitive `PayDoctorFeeSettlementUseCase`/
 * `PayExpenseUseCase` already use for other system-generated postings.
 *
 * Reads Billing's own `IInvoiceRepository`/`IPaymentRepository` (cross-
 * module read through Billing's own repository interfaces, not a raw
 * cross-module Prisma join) because `PaymentCompletedPayload` doesn't
 * carry the `branchId`/`paymentMethodId` this posting needs; see this
 * use case's own event-payload doc-comment in BillingEvents.ts for why
 * `paymentIds` was added to that event.
 *
 * Idempotency (task-162 AC: "FIN_DUPLICATE_POSTING... redelivery is a
 * safe no-op"): each Payment line is checked individually via
 * `IJournalRepository.findByReference(BILLING_PAYMENT, paymentId,
 * BILLING_PAYMENT)` before posting -- an already-posted line is skipped
 * (true no-op, so a partially-processed prior redelivery can still
 * complete the remaining lines). Only if *every* line in this event has
 * already been posted does the whole call raise
 * `JournalDuplicatePostingException` (FIN_DUPLICATE_POSTING), signalling
 * a pure redelivery with nothing left to do -- mirroring task-136's
 * identical "idempotent redelivery" AC phrasing and design.
 *
 * `FIN_ACCOUNT_MAPPING_MISSING` (task-162 AC: "raised and surfaced to an
 * operational alert, not silently dropped") is thrown per missing/
 * inactive/non-postable mapping; the event-subscription wrapper in
 * finance.routes.ts (mirroring Warehouse's own
 * `warehouse.material-consumption-failed.v1` pattern for task-136) is
 * what actually surfaces the alert, since raising the exception here
 * keeps this use case unit-testable and this module's own subscription
 * site is where every other cross-module event failure in this codebase
 * is already logged/surfaced.
 */
export class RecordBillingPaymentUseCase {
  constructor(
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly paymentRepository: IPaymentRepository,
    private readonly accountMappingRepository: IFinanceAccountMappingRepository,
    private readonly cashAccountRepository: ICashAccountRepository,
    private readonly accountRepository: IAccountRepository,
    private readonly journalRepository: IJournalRepository,
    private readonly numberGenerator: JournalNumberGenerator,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: RecordBillingPaymentInput): Promise<void> {
    const invoice = await this.invoiceRepository.findById(input.invoiceId);
    if (!invoice) {
      throw new InvoiceNotFoundException();
    }

    let postedAny = false;

    for (const paymentId of input.paymentIds) {
      const payment = await this.paymentRepository.findById(paymentId);
      if (!payment) {
        throw new PaymentNotFoundException();
      }

      const existingJournal = await this.journalRepository.findByReference(REFERENCE_TYPE, payment.id, POSTING_TYPE);
      if (existingJournal) {
        continue;
      }

      const mapping = await this.accountMappingRepository.findByBranchAndPaymentMethod(invoice.branchId, payment.paymentMethodId);
      if (!mapping || !mapping.isActive) {
        throw new AccountMappingMissingException();
      }

      const cashAccount = await this.cashAccountRepository.findById(mapping.cashAccountId);
      if (!cashAccount || !cashAccount.isActive) {
        throw new AccountMappingMissingException();
      }

      const revenueAccount = await this.accountRepository.findById(mapping.revenueAccountId);
      if (!revenueAccount || !revenueAccount.isActive || !revenueAccount.isPostable) {
        throw new AccountMappingMissingException();
      }

      const amount = Number(payment.amount);
      const journalNo = await this.numberGenerator.generate(payment.paymentDate);
      const description = `Payment received for invoice ${invoice.invoiceNo}`;
      const journal = await this.journalRepository.createPosted({
        journalNo,
        branchId: invoice.branchId,
        journalDate: payment.paymentDate,
        description,
        referenceType: REFERENCE_TYPE,
        referenceId: payment.id,
        postingType: POSTING_TYPE,
        lines: [
          { accountId: cashAccount.ledgerAccountId, debit: amount, credit: 0, description },
          { accountId: mapping.revenueAccountId, debit: 0, credit: amount, description },
        ],
        createdBy: input.actorUserId,
        postedBy: SYSTEM_ACTOR,
      });

      await this.cashAccountRepository.adjustBalance(cashAccount.id, amount);

      const auditContext: AuditContext = { userId: input.actorUserId };
      await this.auditService.record(
        'Journal',
        journal.id,
        'CREATE',
        null,
        { referenceType: REFERENCE_TYPE, referenceId: payment.id, amount, journalNo },
        auditContext,
      );

      postedAny = true;
    }

    if (!postedAny && input.paymentIds.length > 0) {
      throw new JournalDuplicatePostingException();
    }
  }
}
