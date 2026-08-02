import { RequestHandler, Router } from 'express';
import { IAuditService } from '../../../system/domain/services/IAuditService';
import { IEventBus } from '../../../../shared/events/EventBus';
import { validateBody } from '../../../../shared/http/validateBody';
import { validateQuery } from '../../../../shared/http/validateQuery';
import { CreateAccountRequestDto, UpdateAccountRequestDto } from '../../application/dtos/AccountRequestDto';
import { ListAccountQueryDto } from '../../application/dtos/AccountQueryDto';
import { CreateAccountUseCase } from '../../application/use-cases/CreateAccountUseCase';
import { ListAccountsUseCase } from '../../application/use-cases/ListAccountsUseCase';
import { UpdateAccountUseCase } from '../../application/use-cases/UpdateAccountUseCase';
import { DeactivateAccountUseCase } from '../../application/use-cases/DeactivateAccountUseCase';
import { AccountRepository } from '../../infrastructure/repositories/AccountRepository';
import { AccountController } from '../controllers/AccountController';

/**
 * docs/06-tasks/task-143.md..task-145.md (Epic AB, Finance Foundation)
 * composition root. `eventBus` isn't consumed by Chart of Accounts itself
 * (no endpoint here publishes/subscribes) but is threaded through now,
 * matching every other module's `buildXModule(auditService, eventBus,
 * authenticate, requirePermission)` signature, since Epic AC (Journals)
 * immediately needs it for `finance.journal.posted.v1`.
 */
export function buildFinanceModule(
  auditService: IAuditService,
  _eventBus: IEventBus,
  authenticate: RequestHandler,
  requirePermission: (code: string) => RequestHandler,
): Router {
  const accountRepository = new AccountRepository();

  const accountController = new AccountController(
    new CreateAccountUseCase(accountRepository, auditService),
    new ListAccountsUseCase(accountRepository),
    new UpdateAccountUseCase(accountRepository, auditService),
    new DeactivateAccountUseCase(accountRepository, auditService),
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

  return router;
}
