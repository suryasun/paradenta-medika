import { CreateManualJournalUseCase } from './CreateManualJournalUseCase';
import { UpdateJournalUseCase } from './UpdateJournalUseCase';
import { PostJournalUseCase } from './PostJournalUseCase';
import { ReverseJournalUseCase } from './ReverseJournalUseCase';
import { VoidJournalUseCase } from './VoidJournalUseCase';
import { CreatePeriodUseCase } from './CreatePeriodUseCase';
import { CreateAccountUseCase } from './CreateAccountUseCase';
import { JournalNumberGenerator } from '../services/JournalNumberGenerator';
import { FakeAccountRepository, FakeFinancialPeriodRepository, FakeJournalRepository } from '../../../../../tests/fakes/financeFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { InMemoryEventBus } from '../../../../shared/events/EventBus';
import {
  AccountNotPostableException,
  FinancialPeriodClosedException,
  JournalNotInStatusException,
  JournalSegregationOfDutiesException,
  JournalUnbalancedException,
} from '../../domain/exceptions/FinanceExceptions';

function buildSut() {
  const accountRepository = new FakeAccountRepository();
  const journalRepository = new FakeJournalRepository();
  const financialPeriodRepository = new FakeFinancialPeriodRepository();
  const auditService = new FakeAuditService();
  const eventBus = new InMemoryEventBus();

  return {
    accountRepository,
    journalRepository,
    financialPeriodRepository,
    eventBus,
    createAccountUseCase: new CreateAccountUseCase(accountRepository, auditService),
    createPeriodUseCase: new CreatePeriodUseCase(financialPeriodRepository, auditService),
    createJournalUseCase: new CreateManualJournalUseCase(journalRepository, accountRepository, auditService),
    updateJournalUseCase: new UpdateJournalUseCase(journalRepository, accountRepository, auditService),
    postJournalUseCase: new PostJournalUseCase(
      journalRepository,
      financialPeriodRepository,
      new JournalNumberGenerator(journalRepository),
      auditService,
      eventBus,
    ),
    reverseJournalUseCase: new ReverseJournalUseCase(
      journalRepository,
      financialPeriodRepository,
      new JournalNumberGenerator(journalRepository),
      auditService,
      eventBus,
    ),
    voidJournalUseCase: new VoidJournalUseCase(journalRepository, auditService),
  };
}

async function seedExpenseAndCashAccounts(accountRepository: FakeAccountRepository, createAccountUseCase: CreateAccountUseCase) {
  const cash = await createAccountUseCase.execute({
    code: '1110',
    name: 'Kas',
    accountType: 'asset',
    normalBalance: 'debit',
    isPostable: true,
    actorUserId: 'manager-1',
  });
  const expense = await createAccountUseCase.execute({
    code: '5100',
    name: 'Beban Listrik',
    accountType: 'expense',
    normalBalance: 'debit',
    isPostable: true,
    actorUserId: 'manager-1',
  });
  void accountRepository;
  return { cash, expense };
}

describe('Journal lifecycle (task-146-152, UC-FIN-002)', () => {
  it('rejects an unbalanced journal', async () => {
    const { accountRepository, createAccountUseCase, createJournalUseCase } = buildSut();
    const { cash, expense } = await seedExpenseAndCashAccounts(accountRepository, createAccountUseCase);

    await expect(
      createJournalUseCase.execute({
        branchId: 'branch-1',
        journalDate: '2026-07-31',
        description: 'Unbalanced entry',
        lines: [
          { accountId: expense.id, debit: 1000, credit: 0 },
          { accountId: cash.id, debit: 0, credit: 900 },
        ],
        actorUserId: 'staff-1',
      }),
    ).rejects.toBeInstanceOf(JournalUnbalancedException);
  });

  it('rejects a line targeting a non-postable (heading) account', async () => {
    const { accountRepository, createAccountUseCase, createJournalUseCase } = buildSut();
    const { cash } = await seedExpenseAndCashAccounts(accountRepository, createAccountUseCase);
    const heading = await createAccountUseCase.execute({
      code: '5000',
      name: 'Expenses',
      accountType: 'expense',
      normalBalance: 'debit',
      isPostable: false,
      actorUserId: 'manager-1',
    });

    await expect(
      createJournalUseCase.execute({
        branchId: 'branch-1',
        journalDate: '2026-07-31',
        description: 'Targets a heading',
        lines: [
          { accountId: heading.id, debit: 1000, credit: 0 },
          { accountId: cash.id, debit: 0, credit: 1000 },
        ],
        actorUserId: 'staff-1',
      }),
    ).rejects.toBeInstanceOf(AccountNotPostableException);
  });

  it('rejects posting before an open period exists (FIN_PERIOD_CLOSED)', async () => {
    const { accountRepository, createAccountUseCase, journalRepository, financialPeriodRepository, createJournalUseCase, postJournalUseCase } = buildSut();
    const { cash, expense } = await seedExpenseAndCashAccounts(accountRepository, createAccountUseCase);
    const journal = await createJournalUseCase.execute({
      branchId: 'branch-1',
      journalDate: '2026-07-31',
      description: 'Accrual listrik Juli 2026',
      lines: [
        { accountId: expense.id, debit: 1250000, credit: 0 },
        { accountId: cash.id, debit: 0, credit: 1250000 },
      ],
      actorUserId: 'staff-1',
    });

    expect(financialPeriodRepository.periods.size).toBe(0);
    await expect(postJournalUseCase.execute({ journalId: journal.id, actorUserId: 'manager-1' })).rejects.toBeInstanceOf(
      FinancialPeriodClosedException,
    );
    void journalRepository;
  });

  it('rejects self-posting (FIN_SEGREGATION_OF_DUTIES)', async () => {
    const { accountRepository, createAccountUseCase, createPeriodUseCase, createJournalUseCase, postJournalUseCase } = buildSut();
    const { cash, expense } = await seedExpenseAndCashAccounts(accountRepository, createAccountUseCase);
    await createPeriodUseCase.execute({
      branchId: 'branch-1',
      periodName: 'Juli 2026',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      actorUserId: 'manager-1',
    });
    const journal = await createJournalUseCase.execute({
      branchId: 'branch-1',
      journalDate: '2026-07-31',
      description: 'Accrual listrik Juli 2026',
      lines: [
        { accountId: expense.id, debit: 1250000, credit: 0 },
        { accountId: cash.id, debit: 0, credit: 1250000 },
      ],
      actorUserId: 'staff-1',
    });

    await expect(postJournalUseCase.execute({ journalId: journal.id, actorUserId: 'staff-1' })).rejects.toBeInstanceOf(
      JournalSegregationOfDutiesException,
    );
  });

  it('posts a balanced journal within an open period, assigning journalNo only at post time', async () => {
    const { accountRepository, createAccountUseCase, createPeriodUseCase, createJournalUseCase, postJournalUseCase, eventBus } = buildSut();
    let publishedEvent: unknown = null;
    eventBus.subscribe('finance.journal.posted.v1', (payload) => {
      publishedEvent = payload;
    });

    const { cash, expense } = await seedExpenseAndCashAccounts(accountRepository, createAccountUseCase);
    await createPeriodUseCase.execute({
      branchId: 'branch-1',
      periodName: 'Juli 2026',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      actorUserId: 'manager-1',
    });
    const journal = await createJournalUseCase.execute({
      branchId: 'branch-1',
      journalDate: '2026-07-31',
      description: 'Accrual listrik Juli 2026',
      lines: [
        { accountId: expense.id, debit: 1250000, credit: 0 },
        { accountId: cash.id, debit: 0, credit: 1250000 },
      ],
      actorUserId: 'staff-1',
    });
    expect(journal.journalNo).toBeNull();

    const posted = await postJournalUseCase.execute({ journalId: journal.id, actorUserId: 'manager-1' });
    expect(posted.status).toBe('POSTED');
    expect(posted.journalNo).not.toBeNull();
    expect(publishedEvent).not.toBeNull();
  });

  it('rejects updating a posted journal', async () => {
    const { accountRepository, createAccountUseCase, createPeriodUseCase, createJournalUseCase, postJournalUseCase, updateJournalUseCase } = buildSut();
    const { cash, expense } = await seedExpenseAndCashAccounts(accountRepository, createAccountUseCase);
    await createPeriodUseCase.execute({
      branchId: 'branch-1',
      periodName: 'Juli 2026',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      actorUserId: 'manager-1',
    });
    const journal = await createJournalUseCase.execute({
      branchId: 'branch-1',
      journalDate: '2026-07-31',
      description: 'Accrual listrik Juli 2026',
      lines: [
        { accountId: expense.id, debit: 1250000, credit: 0 },
        { accountId: cash.id, debit: 0, credit: 1250000 },
      ],
      actorUserId: 'staff-1',
    });
    await postJournalUseCase.execute({ journalId: journal.id, actorUserId: 'manager-1' });

    await expect(
      updateJournalUseCase.execute({ journalId: journal.id, description: 'edited', actorUserId: 'staff-1' }),
    ).rejects.toBeInstanceOf(JournalNotInStatusException);
  });

  it('rejects voiding an already-posted journal (must use reverse)', async () => {
    const { accountRepository, createAccountUseCase, createPeriodUseCase, createJournalUseCase, postJournalUseCase, voidJournalUseCase } = buildSut();
    const { cash, expense } = await seedExpenseAndCashAccounts(accountRepository, createAccountUseCase);
    await createPeriodUseCase.execute({
      branchId: 'branch-1',
      periodName: 'Juli 2026',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      actorUserId: 'manager-1',
    });
    const journal = await createJournalUseCase.execute({
      branchId: 'branch-1',
      journalDate: '2026-07-31',
      description: 'Accrual listrik Juli 2026',
      lines: [
        { accountId: expense.id, debit: 1250000, credit: 0 },
        { accountId: cash.id, debit: 0, credit: 1250000 },
      ],
      actorUserId: 'staff-1',
    });
    await postJournalUseCase.execute({ journalId: journal.id, actorUserId: 'manager-1' });

    await expect(voidJournalUseCase.execute({ journalId: journal.id, actorUserId: 'staff-1' })).rejects.toBeInstanceOf(
      JournalNotInStatusException,
    );
  });

  it('voids a draft journal', async () => {
    const { accountRepository, createAccountUseCase, createJournalUseCase, voidJournalUseCase } = buildSut();
    const { cash, expense } = await seedExpenseAndCashAccounts(accountRepository, createAccountUseCase);
    const journal = await createJournalUseCase.execute({
      branchId: 'branch-1',
      journalDate: '2026-07-31',
      description: 'Mistake entry',
      lines: [
        { accountId: expense.id, debit: 1000, credit: 0 },
        { accountId: cash.id, debit: 0, credit: 1000 },
      ],
      actorUserId: 'staff-1',
    });

    const voided = await voidJournalUseCase.execute({ journalId: journal.id, reason: 'wrong account', actorUserId: 'staff-1' });
    expect(voided.status).toBe('VOIDED');
  });

  it('reverses a posted journal with swapped debit/credit lines and rejects reversing it twice', async () => {
    const { accountRepository, createAccountUseCase, createPeriodUseCase, createJournalUseCase, postJournalUseCase, reverseJournalUseCase, eventBus } =
      buildSut();
    let reversedEvent: unknown = null;
    eventBus.subscribe('finance.journal.reversed.v1', (payload) => {
      reversedEvent = payload;
    });

    const { cash, expense } = await seedExpenseAndCashAccounts(accountRepository, createAccountUseCase);
    await createPeriodUseCase.execute({
      branchId: 'branch-1',
      periodName: 'Juli 2026',
      startDate: '2026-07-01',
      endDate: '2026-08-31',
      actorUserId: 'manager-1',
    });
    const journal = await createJournalUseCase.execute({
      branchId: 'branch-1',
      journalDate: '2026-07-31',
      description: 'Accrual listrik Juli 2026',
      lines: [
        { accountId: expense.id, debit: 1250000, credit: 0 },
        { accountId: cash.id, debit: 0, credit: 1250000 },
      ],
      actorUserId: 'staff-1',
    });
    await postJournalUseCase.execute({ journalId: journal.id, actorUserId: 'manager-1' });

    const reversal = await reverseJournalUseCase.execute({
      journalId: journal.id,
      journalDate: '2026-08-01',
      reason: 'Duplicate accrual',
      actorUserId: 'manager-1',
    });
    expect(reversal.status).toBe('POSTED');
    expect(reversal.reversalOfId).toBe(journal.id);
    expect(reversal.lines.find((l) => l.accountId === expense.id)?.credit).toBe(1250000);
    expect(reversal.lines.find((l) => l.accountId === cash.id)?.debit).toBe(1250000);
    expect(reversedEvent).not.toBeNull();

    await expect(
      reverseJournalUseCase.execute({
        journalId: journal.id,
        journalDate: '2026-08-02',
        reason: 'Second attempt',
        actorUserId: 'manager-1',
      }),
    ).rejects.toBeInstanceOf(JournalNotInStatusException);
  });
});
