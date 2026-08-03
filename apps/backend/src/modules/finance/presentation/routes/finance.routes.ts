import { RequestHandler, Router } from 'express';
import { IAuditService } from '../../../system/domain/services/IAuditService';
import { IEventBus } from '../../../../shared/events/EventBus';
import { validateBody } from '../../../../shared/http/validateBody';
import { validateQuery } from '../../../../shared/http/validateQuery';
import { CreateAccountRequestDto, UpdateAccountRequestDto } from '../../application/dtos/AccountRequestDto';
import { ListAccountQueryDto } from '../../application/dtos/AccountQueryDto';
import { CreateJournalRequestDto, ReverseJournalRequestDto, UpdateJournalRequestDto, VoidJournalRequestDto } from '../../application/dtos/JournalRequestDto';
import { ListJournalQueryDto } from '../../application/dtos/JournalQueryDto';
import { CreateFinancialPeriodRequestDto } from '../../application/dtos/FinancialPeriodRequestDto';
import { ListFinancialPeriodQueryDto } from '../../application/dtos/FinancialPeriodQueryDto';
import { CreateCashAccountRequestDto } from '../../application/dtos/CashAccountRequestDto';
import { ListCashAccountQueryDto } from '../../application/dtos/CashAccountQueryDto';
import { CreateCashTransferRequestDto } from '../../application/dtos/CashTransferRequestDto';
import {
  CreateExpenseRequestDto,
  PayExpenseRequestDto,
  RejectExpenseRequestDto,
  UpdateExpenseRequestDto,
} from '../../application/dtos/ExpenseRequestDto';
import { ListExpenseQueryDto } from '../../application/dtos/ExpenseQueryDto';
import { CreateDailyClosingRequestDto } from '../../application/dtos/DailyClosingRequestDto';
import { ListDailyClosingQueryDto } from '../../application/dtos/DailyClosingQueryDto';
import { GenerateDoctorFeeSettlementRequestDto, PayDoctorFeeSettlementRequestDto } from '../../application/dtos/DoctorFeeSettlementRequestDto';
import { ReopenFinancialPeriodRequestDto } from '../../application/dtos/FinancialPeriodReopenRequestDto';
import { CreateFinanceAccountMappingRequestDto } from '../../application/dtos/FinanceAccountMappingRequestDto';
import {
  CashFlowQueryDto,
  DailyClosingReportQueryDto,
  ExpensesReportQueryDto,
  GeneralLedgerQueryDto,
  IncomeStatementQueryDto,
  TrialBalanceQueryDto,
} from '../../application/dtos/ReportQueryDto';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { CreateAccountUseCase } from '../../application/use-cases/CreateAccountUseCase';
import { ListAccountsUseCase } from '../../application/use-cases/ListAccountsUseCase';
import { UpdateAccountUseCase } from '../../application/use-cases/UpdateAccountUseCase';
import { DeactivateAccountUseCase } from '../../application/use-cases/DeactivateAccountUseCase';
import { CreateManualJournalUseCase } from '../../application/use-cases/CreateManualJournalUseCase';
import { ListJournalsUseCase } from '../../application/use-cases/ListJournalsUseCase';
import { GetJournalUseCase } from '../../application/use-cases/GetJournalUseCase';
import { UpdateJournalUseCase } from '../../application/use-cases/UpdateJournalUseCase';
import { PostJournalUseCase } from '../../application/use-cases/PostJournalUseCase';
import { ReverseJournalUseCase } from '../../application/use-cases/ReverseJournalUseCase';
import { VoidJournalUseCase } from '../../application/use-cases/VoidJournalUseCase';
import { CreatePeriodUseCase } from '../../application/use-cases/CreatePeriodUseCase';
import { ListPeriodsUseCase } from '../../application/use-cases/ListPeriodsUseCase';
import { CreateCashAccountUseCase } from '../../application/use-cases/CreateCashAccountUseCase';
import { ListCashAccountsUseCase } from '../../application/use-cases/ListCashAccountsUseCase';
import { GetCashAccountMovementsUseCase } from '../../application/use-cases/GetCashAccountMovementsUseCase';
import { CreateCashTransferUseCase } from '../../application/use-cases/CreateCashTransferUseCase';
import { CreateExpenseUseCase } from '../../application/use-cases/CreateExpenseUseCase';
import { ListExpensesUseCase } from '../../application/use-cases/ListExpensesUseCase';
import { GetExpenseUseCase } from '../../application/use-cases/GetExpenseUseCase';
import { UpdateExpenseUseCase } from '../../application/use-cases/UpdateExpenseUseCase';
import { SubmitExpenseUseCase } from '../../application/use-cases/SubmitExpenseUseCase';
import { ApproveExpenseUseCase } from '../../application/use-cases/ApproveExpenseUseCase';
import { RejectExpenseUseCase } from '../../application/use-cases/RejectExpenseUseCase';
import { PayExpenseUseCase } from '../../application/use-cases/PayExpenseUseCase';
import { CreateDailyClosingUseCase } from '../../application/use-cases/CreateDailyClosingUseCase';
import { ApproveDailyClosingUseCase } from '../../application/use-cases/ApproveDailyClosingUseCase';
import { ListDailyClosingsUseCase } from '../../application/use-cases/ListDailyClosingsUseCase';
import { GenerateDoctorFeeSettlementUseCase } from '../../application/use-cases/GenerateDoctorFeeSettlementUseCase';
import { ApproveDoctorFeeSettlementUseCase } from '../../application/use-cases/ApproveDoctorFeeSettlementUseCase';
import { PayDoctorFeeSettlementUseCase } from '../../application/use-cases/PayDoctorFeeSettlementUseCase';
import { LockFinancialPeriodUseCase } from '../../application/use-cases/LockFinancialPeriodUseCase';
import { CloseFinancialPeriodUseCase } from '../../application/use-cases/CloseFinancialPeriodUseCase';
import { ReopenFinancialPeriodUseCase } from '../../application/use-cases/ReopenFinancialPeriodUseCase';
import { GetTrialBalanceReportUseCase } from '../../application/use-cases/GetTrialBalanceReportUseCase';
import { GetGeneralLedgerReportUseCase } from '../../application/use-cases/GetGeneralLedgerReportUseCase';
import { GetIncomeStatementReportUseCase } from '../../application/use-cases/GetIncomeStatementReportUseCase';
import { GetCashFlowReportUseCase } from '../../application/use-cases/GetCashFlowReportUseCase';
import { GetExpensesReportUseCase } from '../../application/use-cases/GetExpensesReportUseCase';
import { GetDailyClosingReportUseCase } from '../../application/use-cases/GetDailyClosingReportUseCase';
import { CreateFinanceAccountMappingUseCase } from '../../application/use-cases/CreateFinanceAccountMappingUseCase';
import { ListFinanceAccountMappingsUseCase } from '../../application/use-cases/ListFinanceAccountMappingsUseCase';
import { RecordBillingPaymentUseCase } from '../../application/use-cases/RecordBillingPaymentUseCase';
import { JournalNumberGenerator } from '../../application/services/JournalNumberGenerator';
import { ExpenseNumberGenerator } from '../../application/services/ExpenseNumberGenerator';
import { DoctorFeeSettlementNumberGenerator } from '../../application/services/DoctorFeeSettlementNumberGenerator';
import { ReportDateRangeResolver } from '../../application/services/ReportDateRangeResolver';
import { AccountRepository } from '../../infrastructure/repositories/AccountRepository';
import { JournalRepository } from '../../infrastructure/repositories/JournalRepository';
import { FinancialPeriodRepository } from '../../infrastructure/repositories/FinancialPeriodRepository';
import { CashAccountRepository } from '../../infrastructure/repositories/CashAccountRepository';
import { ExpenseRepository } from '../../infrastructure/repositories/ExpenseRepository';
import { DailyClosingRepository } from '../../infrastructure/repositories/DailyClosingRepository';
import { DoctorFeeSettlementRepository } from '../../infrastructure/repositories/DoctorFeeSettlementRepository';
import { FinanceReportRepository } from '../../infrastructure/repositories/FinanceReportRepository';
import { FinanceAccountMappingRepository } from '../../infrastructure/repositories/FinanceAccountMappingRepository';
import { VisitTreatmentRepository } from '../../../emr/infrastructure/repositories/VisitTreatmentRepository';
import { PaymentMethodRepository } from '../../../master-data/infrastructure/repositories/PaymentMethodRepository';
import { InvoiceRepository } from '../../../billing/infrastructure/repositories/InvoiceRepository';
import { PaymentRepository } from '../../../billing/infrastructure/repositories/PaymentRepository';
import { PAYMENT_COMPLETED_EVENT, PaymentCompletedPayload } from '../../../billing/domain/events/BillingEvents';
import { AccountController } from '../controllers/AccountController';
import { JournalController } from '../controllers/JournalController';
import { FinancialPeriodController } from '../controllers/FinancialPeriodController';
import { CashAccountController } from '../controllers/CashAccountController';
import { CashTransferController } from '../controllers/CashTransferController';
import { ExpenseController } from '../controllers/ExpenseController';
import { DailyClosingController } from '../controllers/DailyClosingController';
import { DoctorFeeSettlementController } from '../controllers/DoctorFeeSettlementController';
import { FinanceReportController } from '../controllers/FinanceReportController';
import { FinanceAccountMappingController } from '../controllers/FinanceAccountMappingController';

/**
 * docs/06-tasks/task-143.md..task-152.md (Epic AB Finance Foundation +
 * Epic AC Journals) composition root. task-168 (Financial Period Create/
 * List) is folded in here per this phase's documented sequencing --
 * PostJournalUseCase's `FIN_PERIOD_CLOSED` check needs it; Lock/Close/
 * Reopen (task-169-171) remain Epic AE's own composition-root additions.
 */
export function buildFinanceModule(
  auditService: IAuditService,
  eventBus: IEventBus,
  authenticate: RequestHandler,
  requirePermission: (code: string) => RequestHandler,
): Router {
  const accountRepository = new AccountRepository();
  const journalRepository = new JournalRepository();
  const financialPeriodRepository = new FinancialPeriodRepository();
  const cashAccountRepository = new CashAccountRepository();
  const expenseRepository = new ExpenseRepository();
  const dailyClosingRepository = new DailyClosingRepository();
  const doctorFeeSettlementRepository = new DoctorFeeSettlementRepository();
  const visitTreatmentRepository = new VisitTreatmentRepository();
  const financeReportRepository = new FinanceReportRepository();
  const financeAccountMappingRepository = new FinanceAccountMappingRepository();
  const paymentMethodRepository = new PaymentMethodRepository();
  const invoiceRepository = new InvoiceRepository();
  const paymentRepository = new PaymentRepository();
  const reportDateRangeResolver = new ReportDateRangeResolver(financialPeriodRepository);

  const financeAccountMappingController = new FinanceAccountMappingController(
    new CreateFinanceAccountMappingUseCase(financeAccountMappingRepository, paymentMethodRepository, cashAccountRepository, accountRepository, auditService),
    new ListFinanceAccountMappingsUseCase(financeAccountMappingRepository),
  );

  /**
   * docs/06-tasks/task-162.md (Finance, Epic AE, UC-FIN-001). Subscribes to
   * Billing's `PaymentCompleted`, mirroring Billing's own subscription to
   * EMRFinished (billing.routes.ts) and Warehouse's subscription to
   * `emr.treatment-material-finalized.v1` (warehouse.routes.ts). Wrapped in
   * try/catch for the same reason: Finance is downstream of Billing, so an
   * account-mapping or duplicate-posting failure here must never propagate
   * back through the shared event bus and fail the payment transaction
   * that triggered it. `FIN_ACCOUNT_MAPPING_MISSING` is logged at ERROR
   * level specifically (not just the generic catch-all) per task-162's own
   * AC that this failure must be "surfaced to an operational alert, not
   * silently dropped."
   */
  const recordBillingPaymentUseCase = new RecordBillingPaymentUseCase(
    invoiceRepository,
    paymentRepository,
    financeAccountMappingRepository,
    cashAccountRepository,
    accountRepository,
    journalRepository,
    new JournalNumberGenerator(journalRepository),
    auditService,
  );
  eventBus.subscribe<PaymentCompletedPayload>(PAYMENT_COMPLETED_EVENT, async (payload) => {
    try {
      await recordBillingPaymentUseCase.execute({
        invoiceId: payload.invoiceId,
        paymentIds: payload.paymentIds,
        actorUserId: 'system:billing-payment',
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[OPERATIONAL ALERT] Failed to post Billing payment to Finance', payload.invoiceId, error);
    }
  });

  const accountController = new AccountController(
    new CreateAccountUseCase(accountRepository, auditService),
    new ListAccountsUseCase(accountRepository),
    new UpdateAccountUseCase(accountRepository, auditService),
    new DeactivateAccountUseCase(accountRepository, auditService),
  );

  const journalController = new JournalController(
    new CreateManualJournalUseCase(journalRepository, accountRepository, auditService),
    new ListJournalsUseCase(journalRepository),
    new GetJournalUseCase(journalRepository),
    new UpdateJournalUseCase(journalRepository, accountRepository, auditService),
    new PostJournalUseCase(journalRepository, financialPeriodRepository, new JournalNumberGenerator(journalRepository), auditService, eventBus),
    new ReverseJournalUseCase(journalRepository, financialPeriodRepository, new JournalNumberGenerator(journalRepository), auditService, eventBus),
    new VoidJournalUseCase(journalRepository, auditService),
  );

  const financialPeriodController = new FinancialPeriodController(
    new CreatePeriodUseCase(financialPeriodRepository, auditService),
    new ListPeriodsUseCase(financialPeriodRepository),
    new LockFinancialPeriodUseCase(financialPeriodRepository, auditService),
    new CloseFinancialPeriodUseCase(financialPeriodRepository, auditService, eventBus),
    new ReopenFinancialPeriodUseCase(financialPeriodRepository, auditService),
  );

  const cashAccountController = new CashAccountController(
    new CreateCashAccountUseCase(cashAccountRepository, accountRepository, auditService),
    new ListCashAccountsUseCase(cashAccountRepository),
    new GetCashAccountMovementsUseCase(cashAccountRepository, journalRepository),
  );

  const cashTransferController = new CashTransferController(
    new CreateCashTransferUseCase(
      cashAccountRepository,
      journalRepository,
      financialPeriodRepository,
      new JournalNumberGenerator(journalRepository),
      auditService,
    ),
  );

  const expenseController = new ExpenseController(
    new CreateExpenseUseCase(expenseRepository, accountRepository, new ExpenseNumberGenerator(expenseRepository), auditService),
    new ListExpensesUseCase(expenseRepository),
    new GetExpenseUseCase(expenseRepository),
    new UpdateExpenseUseCase(expenseRepository, accountRepository, auditService),
    new SubmitExpenseUseCase(expenseRepository, auditService),
    new ApproveExpenseUseCase(expenseRepository, auditService),
    new RejectExpenseUseCase(expenseRepository, auditService),
    new PayExpenseUseCase(
      expenseRepository,
      cashAccountRepository,
      journalRepository,
      financialPeriodRepository,
      new JournalNumberGenerator(journalRepository),
      auditService,
    ),
  );

  const dailyClosingController = new DailyClosingController(
    new CreateDailyClosingUseCase(dailyClosingRepository, cashAccountRepository, auditService),
    new ApproveDailyClosingUseCase(dailyClosingRepository, auditService, eventBus),
    new ListDailyClosingsUseCase(dailyClosingRepository),
  );

  const doctorFeeSettlementController = new DoctorFeeSettlementController(
    new GenerateDoctorFeeSettlementUseCase(
      doctorFeeSettlementRepository,
      visitTreatmentRepository,
      accountRepository,
      new DoctorFeeSettlementNumberGenerator(doctorFeeSettlementRepository),
      auditService,
    ),
    new ApproveDoctorFeeSettlementUseCase(doctorFeeSettlementRepository, auditService),
    new PayDoctorFeeSettlementUseCase(
      doctorFeeSettlementRepository,
      cashAccountRepository,
      journalRepository,
      financialPeriodRepository,
      new JournalNumberGenerator(journalRepository),
      auditService,
    ),
  );

  const financeReportController = new FinanceReportController(
    new GetTrialBalanceReportUseCase(financeReportRepository, reportDateRangeResolver),
    new GetGeneralLedgerReportUseCase(financeReportRepository, reportDateRangeResolver),
    new GetIncomeStatementReportUseCase(financeReportRepository, reportDateRangeResolver),
    new GetCashFlowReportUseCase(financeReportRepository, reportDateRangeResolver),
    new GetExpensesReportUseCase(expenseRepository, reportDateRangeResolver),
    new GetDailyClosingReportUseCase(dailyClosingRepository, reportDateRangeResolver),
  );

  const router = Router();
  router.use(authenticate);

  // docs/03-sad/17-module-finance.md Section 6.1 -- literal `finance.account.*` permission verbs.
  router.get('/finance/accounts', requirePermission('finance.account.read'), validateQuery(ListAccountQueryDto), accountController.list);
  router.post(
    '/finance/accounts',
    requirePermission('finance.account.manage'),
    validateBody(CreateAccountRequestDto),
    accountController.create,
  );
  router.patch(
    '/finance/accounts/:accountId',
    requirePermission('finance.account.manage'),
    validateBody(UpdateAccountRequestDto),
    accountController.update,
  );
  router.post('/finance/accounts/:accountId/deactivate', requirePermission('finance.account.manage'), accountController.deactivate);

  // docs/06-tasks/task-146.md..task-152.md (Epic AC, UC-FIN-002). Literal
  // `finance.journal.*` Section 8.1 permission verbs -- no extrapolation
  // needed, unlike Warehouse's Epic X/Y.
  router.get('/finance/journals', requirePermission('finance.journal.read'), validateQuery(ListJournalQueryDto), journalController.list);
  router.get('/finance/journals/:journalId', requirePermission('finance.journal.read'), journalController.detail);
  router.post(
    '/finance/journals',
    requirePermission('finance.journal.create'),
    validateBody(CreateJournalRequestDto),
    journalController.create,
  );
  router.patch(
    '/finance/journals/:journalId',
    requirePermission('finance.journal.update'),
    validateBody(UpdateJournalRequestDto),
    journalController.update,
  );
  router.post('/finance/journals/:journalId/post', requirePermission('finance.journal.post'), journalController.post);
  router.post(
    '/finance/journals/:journalId/reverse',
    requirePermission('finance.journal.reverse'),
    validateBody(ReverseJournalRequestDto),
    journalController.reverse,
  );
  router.post(
    '/finance/journals/:journalId/void',
    requirePermission('finance.journal.void'),
    validateBody(VoidJournalRequestDto),
    journalController.void,
  );

  // docs/06-tasks/task-168.md (folded in from Epic AE). Literal
  // `finance.period.*` Section 8.1 verbs; Lock/Close/Reopen land with
  // Epic AE's own routes using the same permission group.
  router.get(
    '/finance/periods',
    requirePermission('finance.period.read'),
    validateQuery(ListFinancialPeriodQueryDto),
    financialPeriodController.list,
  );
  router.post(
    '/finance/periods',
    requirePermission('finance.period.manage'),
    validateBody(CreateFinancialPeriodRequestDto),
    financialPeriodController.create,
  );
  router.post('/finance/periods/:periodId/lock', requirePermission('finance.period.lock'), financialPeriodController.lock);
  router.post('/finance/periods/:periodId/close', requirePermission('finance.period.close'), financialPeriodController.close);
  router.post(
    '/finance/periods/:periodId/reopen',
    requirePermission('finance.period.reopen'),
    validateBody(ReopenFinancialPeriodRequestDto),
    financialPeriodController.reopen,
  );

  // docs/06-tasks/task-153.md..task-155.md (Epic AD, UC-FIN-004). Literal
  // `finance.cash.*` Section 8.1 verbs.
  router.get(
    '/finance/cash-accounts',
    requirePermission('finance.cash.read'),
    validateQuery(ListCashAccountQueryDto),
    cashAccountController.list,
  );
  router.post(
    '/finance/cash-accounts',
    requirePermission('finance.cash.manage'),
    validateBody(CreateCashAccountRequestDto),
    cashAccountController.create,
  );
  router.get(
    '/finance/cash-accounts/:cashAccountId/movements',
    requirePermission('finance.cash.read'),
    validateQuery(ListQueryDto),
    cashAccountController.movements,
  );
  router.post(
    '/finance/cash-transfers',
    requirePermission('finance.cash.transfer'),
    validateBody(CreateCashTransferRequestDto),
    cashTransferController.create,
  );

  // docs/06-tasks/task-156.md..task-161.md (Epic AD, UC-FIN-003). No
  // literal `finance.expense.*` catalog entry names a "create/update"
  // verb split from "read" beyond what Section 8.1 already lists
  // (`finance.expense.read`, `create`, `approve`, `pay`, `cancel`) --
  // Update/Submit reuse `create` (same convention as PO/Journal's own
  // "the permission that lets you draft it lets you edit your own draft"
  // precedent); Reject reuses `approve` (same maker-checker tier as
  // Approve, per Section 8.1's grouping).
  router.get('/finance/expenses', requirePermission('finance.expense.read'), validateQuery(ListExpenseQueryDto), expenseController.list);
  router.post(
    '/finance/expenses',
    requirePermission('finance.expense.create'),
    validateBody(CreateExpenseRequestDto),
    expenseController.create,
  );
  router.get('/finance/expenses/:expenseId', requirePermission('finance.expense.read'), expenseController.detail);
  router.patch(
    '/finance/expenses/:expenseId',
    requirePermission('finance.expense.create'),
    validateBody(UpdateExpenseRequestDto),
    expenseController.update,
  );
  router.post('/finance/expenses/:expenseId/submit', requirePermission('finance.expense.create'), expenseController.submit);
  router.post('/finance/expenses/:expenseId/approve', requirePermission('finance.expense.approve'), expenseController.approve);
  router.post(
    '/finance/expenses/:expenseId/reject',
    requirePermission('finance.expense.approve'),
    validateBody(RejectExpenseRequestDto),
    expenseController.reject,
  );
  router.post(
    '/finance/expenses/:expenseId/pay',
    requirePermission('finance.expense.pay'),
    validateBody(PayExpenseRequestDto),
    expenseController.pay,
  );

  // docs/06-tasks/task-163.md..task-165.md (Epic AE, UC-FIN-005). No
  // literal `finance.daily-closing.*` group exists in Section 8.1 --
  // Daily Closing is part of the `finance.cash.*` group per Section
  // 6.4's own grouping (`/finance/daily-closings` sits under "Cash and
  // Expense" in the API index) and the literal `close`/`approve_close`
  // verbs already listed there.
  router.post(
    '/finance/daily-closings',
    requirePermission('finance.cash.close'),
    validateBody(CreateDailyClosingRequestDto),
    dailyClosingController.create,
  );
  router.post(
    '/finance/daily-closings/:closingId/approve',
    requirePermission('finance.cash.approve_close'),
    dailyClosingController.approve,
  );
  router.get(
    '/finance/daily-closings',
    requirePermission('finance.cash.read'),
    validateQuery(ListDailyClosingQueryDto),
    dailyClosingController.list,
  );

  // docs/06-tasks/task-166.md/task-167.md (Epic AE, UC-FIN-006). Literal
  // `finance.settlement.*` Section 8.1 verbs (read/generate/approve/pay
  // -- `read` unused since no list/get endpoint is in this task set's
  // scope).
  router.post(
    '/finance/doctor-fee-settlements/generate',
    requirePermission('finance.settlement.generate'),
    validateBody(GenerateDoctorFeeSettlementRequestDto),
    doctorFeeSettlementController.generate,
  );
  router.post(
    '/finance/doctor-fee-settlements/:settlementId/approve',
    requirePermission('finance.settlement.approve'),
    doctorFeeSettlementController.approve,
  );
  router.post(
    '/finance/doctor-fee-settlements/:settlementId/pay',
    requirePermission('finance.settlement.pay'),
    validateBody(PayDoctorFeeSettlementRequestDto),
    doctorFeeSettlementController.pay,
  );

  // docs/06-tasks/task-172.md..task-177.md (Epic AF, Section 6.5 Reports).
  // Literal `finance.report.read` Section 8.1 permission -- `finance.report.
  // export` is reserved for a future export-format task, not exercised here.
  router.get(
    '/finance/reports/trial-balance',
    requirePermission('finance.report.read'),
    validateQuery(TrialBalanceQueryDto),
    financeReportController.trialBalance,
  );
  router.get(
    '/finance/reports/general-ledger',
    requirePermission('finance.report.read'),
    validateQuery(GeneralLedgerQueryDto),
    financeReportController.generalLedger,
  );
  router.get(
    '/finance/reports/income-statement',
    requirePermission('finance.report.read'),
    validateQuery(IncomeStatementQueryDto),
    financeReportController.incomeStatement,
  );
  router.get(
    '/finance/reports/cash-flow',
    requirePermission('finance.report.read'),
    validateQuery(CashFlowQueryDto),
    financeReportController.cashFlow,
  );
  router.get(
    '/finance/reports/expenses',
    requirePermission('finance.report.read'),
    validateQuery(ExpensesReportQueryDto),
    financeReportController.expenses,
  );
  router.get(
    '/finance/reports/daily-closing',
    requirePermission('finance.report.read'),
    validateQuery(DailyClosingReportQueryDto),
    financeReportController.dailyClosing,
  );

  // docs/06-tasks/task-162.md Deliverable: "Account-mapping configuration
  // lookup" needs an admin-facing CRUD surface. No literal Section 8.1
  // permission verb exists for this (that catalog predates task-162's
  // account-mapping concept) -- extrapolated as `finance.account-mapping.*`
  // by the same naming convention as `finance.account.*`.
  router.get(
    '/finance/account-mappings',
    requirePermission('finance.account-mapping.read'),
    validateQuery(ListQueryDto),
    financeAccountMappingController.list,
  );
  router.post(
    '/finance/account-mappings',
    requirePermission('finance.account-mapping.manage'),
    validateBody(CreateFinanceAccountMappingRequestDto),
    financeAccountMappingController.create,
  );

  return router;
}
