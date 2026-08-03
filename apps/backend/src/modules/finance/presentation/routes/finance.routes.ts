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
import { JournalNumberGenerator } from '../../application/services/JournalNumberGenerator';
import { AccountRepository } from '../../infrastructure/repositories/AccountRepository';
import { JournalRepository } from '../../infrastructure/repositories/JournalRepository';
import { FinancialPeriodRepository } from '../../infrastructure/repositories/FinancialPeriodRepository';
import { AccountController } from '../controllers/AccountController';
import { JournalController } from '../controllers/JournalController';
import { FinancialPeriodController } from '../controllers/FinancialPeriodController';

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

  return router;
}
