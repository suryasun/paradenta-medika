import { CreateAccountUseCase } from './CreateAccountUseCase';
import { CreatePeriodUseCase } from './CreatePeriodUseCase';
import { CreateCashAccountUseCase } from './CreateCashAccountUseCase';
import { GetCashAccountMovementsUseCase } from './GetCashAccountMovementsUseCase';
import { CreateCashTransferUseCase } from './CreateCashTransferUseCase';
import { CreateExpenseUseCase } from './CreateExpenseUseCase';
import { UpdateExpenseUseCase } from './UpdateExpenseUseCase';
import { SubmitExpenseUseCase } from './SubmitExpenseUseCase';
import { ApproveExpenseUseCase } from './ApproveExpenseUseCase';
import { RejectExpenseUseCase } from './RejectExpenseUseCase';
import { PayExpenseUseCase } from './PayExpenseUseCase';
import { JournalNumberGenerator } from '../services/JournalNumberGenerator';
import { ExpenseNumberGenerator } from '../services/ExpenseNumberGenerator';
import {
  FakeAccountRepository,
  FakeCashAccountRepository,
  FakeExpenseRepository,
  FakeFinancialPeriodRepository,
  FakeJournalRepository,
} from '../../../../../tests/fakes/financeFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import {
  AccountMappingMissingException,
  CashTransferCrossBranchException,
  CashTransferSourceDestinationSameException,
  ExpenseNotApprovedException,
  ExpenseNotInStatusException,
  ExpensePaymentExceedsApprovedException,
  ExpenseSegregationOfDutiesException,
  FinancialPeriodClosedException,
} from '../../domain/exceptions/FinanceExceptions';

function buildSut() {
  const accountRepository = new FakeAccountRepository();
  const journalRepository = new FakeJournalRepository();
  const financialPeriodRepository = new FakeFinancialPeriodRepository();
  const cashAccountRepository = new FakeCashAccountRepository();
  const expenseRepository = new FakeExpenseRepository();
  const auditService = new FakeAuditService();

  return {
    accountRepository,
    journalRepository,
    financialPeriodRepository,
    cashAccountRepository,
    expenseRepository,
    createAccountUseCase: new CreateAccountUseCase(accountRepository, auditService),
    createPeriodUseCase: new CreatePeriodUseCase(financialPeriodRepository, auditService),
    createCashAccountUseCase: new CreateCashAccountUseCase(cashAccountRepository, accountRepository, auditService),
    getCashAccountMovementsUseCase: new GetCashAccountMovementsUseCase(cashAccountRepository, journalRepository),
    createCashTransferUseCase: new CreateCashTransferUseCase(
      cashAccountRepository,
      journalRepository,
      financialPeriodRepository,
      new JournalNumberGenerator(journalRepository),
      auditService,
    ),
    createExpenseUseCase: new CreateExpenseUseCase(expenseRepository, accountRepository, new ExpenseNumberGenerator(expenseRepository), auditService),
    updateExpenseUseCase: new UpdateExpenseUseCase(expenseRepository, accountRepository, auditService),
    submitExpenseUseCase: new SubmitExpenseUseCase(expenseRepository, auditService),
    approveExpenseUseCase: new ApproveExpenseUseCase(expenseRepository, auditService),
    rejectExpenseUseCase: new RejectExpenseUseCase(expenseRepository, auditService),
    payExpenseUseCase: new PayExpenseUseCase(
      expenseRepository,
      cashAccountRepository,
      journalRepository,
      financialPeriodRepository,
      new JournalNumberGenerator(journalRepository),
      auditService,
    ),
  };
}

async function seedLedgerAccounts(createAccountUseCase: CreateAccountUseCase) {
  const cashLedger = await createAccountUseCase.execute({
    code: '1110',
    name: 'Kas Utama',
    accountType: 'asset',
    normalBalance: 'debit',
    isPostable: true,
    actorUserId: 'manager-1',
  });
  const bankLedger = await createAccountUseCase.execute({
    code: '1120',
    name: 'Bank BCA',
    accountType: 'asset',
    normalBalance: 'debit',
    isPostable: true,
    actorUserId: 'manager-1',
  });
  const expenseLedger = await createAccountUseCase.execute({
    code: '5100',
    name: 'Beban Listrik',
    accountType: 'expense',
    normalBalance: 'debit',
    isPostable: true,
    actorUserId: 'manager-1',
  });
  return { cashLedger, bankLedger, expenseLedger };
}

describe('Cash Account & Cash Transfer (task-153-155, UC-FIN-004)', () => {
  it('rejects a cash account whose ledger account is missing/not postable', async () => {
    const { createCashAccountUseCase } = buildSut();
    await expect(
      createCashAccountUseCase.execute({
        branchId: 'branch-1',
        code: 'CASH-1',
        name: 'Kas Utama',
        accountType: 'cash',
        ledgerAccountId: 'nonexistent',
        actorUserId: 'staff-1',
      }),
    ).rejects.toBeInstanceOf(AccountMappingMissingException);
  });

  it('rejects transferring a cash account to itself', async () => {
    const { accountRepository, createAccountUseCase, createCashAccountUseCase, createCashTransferUseCase } = buildSut();
    const { cashLedger } = await seedLedgerAccounts(createAccountUseCase);
    void accountRepository;
    const cash = await createCashAccountUseCase.execute({
      branchId: 'branch-1',
      code: 'CASH-1',
      name: 'Kas Utama',
      accountType: 'cash',
      ledgerAccountId: cashLedger.id,
      actorUserId: 'staff-1',
    });

    await expect(
      createCashTransferUseCase.execute({
        transferDate: '2026-07-31',
        sourceCashAccountId: cash.id,
        destinationCashAccountId: cash.id,
        amount: 100,
        actorUserId: 'staff-1',
      }),
    ).rejects.toBeInstanceOf(CashTransferSourceDestinationSameException);
  });

  it('rejects a cross-branch transfer', async () => {
    const { createAccountUseCase, createCashAccountUseCase, createCashTransferUseCase } = buildSut();
    const { cashLedger, bankLedger } = await seedLedgerAccounts(createAccountUseCase);
    const source = await createCashAccountUseCase.execute({
      branchId: 'branch-1',
      code: 'CASH-1',
      name: 'Kas Utama',
      accountType: 'cash',
      ledgerAccountId: cashLedger.id,
      actorUserId: 'staff-1',
    });
    const destination = await createCashAccountUseCase.execute({
      branchId: 'branch-2',
      code: 'BANK-1',
      name: 'Bank BCA',
      accountType: 'bank',
      ledgerAccountId: bankLedger.id,
      actorUserId: 'staff-1',
    });

    await expect(
      createCashTransferUseCase.execute({
        transferDate: '2026-07-31',
        sourceCashAccountId: source.id,
        destinationCashAccountId: destination.id,
        amount: 100,
        actorUserId: 'staff-1',
      }),
    ).rejects.toBeInstanceOf(CashTransferCrossBranchException);
  });

  it('rejects a transfer outside an open period', async () => {
    const { createAccountUseCase, createCashAccountUseCase, createCashTransferUseCase } = buildSut();
    const { cashLedger, bankLedger } = await seedLedgerAccounts(createAccountUseCase);
    const source = await createCashAccountUseCase.execute({
      branchId: 'branch-1',
      code: 'CASH-1',
      name: 'Kas Utama',
      accountType: 'cash',
      ledgerAccountId: cashLedger.id,
      actorUserId: 'staff-1',
    });
    const destination = await createCashAccountUseCase.execute({
      branchId: 'branch-1',
      code: 'BANK-1',
      name: 'Bank BCA',
      accountType: 'bank',
      ledgerAccountId: bankLedger.id,
      actorUserId: 'staff-1',
    });

    await expect(
      createCashTransferUseCase.execute({
        transferDate: '2026-07-31',
        sourceCashAccountId: source.id,
        destinationCashAccountId: destination.id,
        amount: 100,
        actorUserId: 'staff-1',
      }),
    ).rejects.toBeInstanceOf(FinancialPeriodClosedException);
  });

  it('posts a system journal and updates both cash account balances', async () => {
    const { createAccountUseCase, createPeriodUseCase, createCashAccountUseCase, createCashTransferUseCase, getCashAccountMovementsUseCase } =
      buildSut();
    const { cashLedger, bankLedger } = await seedLedgerAccounts(createAccountUseCase);
    await createPeriodUseCase.execute({
      branchId: 'branch-1',
      periodName: 'Juli 2026',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      actorUserId: 'manager-1',
    });
    const source = await createCashAccountUseCase.execute({
      branchId: 'branch-1',
      code: 'CASH-1',
      name: 'Kas Utama',
      accountType: 'cash',
      ledgerAccountId: cashLedger.id,
      actorUserId: 'staff-1',
    });
    const destination = await createCashAccountUseCase.execute({
      branchId: 'branch-1',
      code: 'BANK-1',
      name: 'Bank BCA',
      accountType: 'bank',
      ledgerAccountId: bankLedger.id,
      actorUserId: 'staff-1',
    });

    const journal = await createCashTransferUseCase.execute({
      transferDate: '2026-07-31',
      sourceCashAccountId: source.id,
      destinationCashAccountId: destination.id,
      amount: 500000,
      actorUserId: 'staff-1',
    });
    expect(journal.status).toBe('POSTED');
    expect(journal.debitTotal).toBe(500000);
    expect(journal.creditTotal).toBe(500000);

    const { items: destMovements } = await getCashAccountMovementsUseCase.execute(destination.id, {
      page: 1,
      limit: 20,
      sort: 'createdAt',
      order: 'desc',
    });
    expect(destMovements[0].debit).toBe(500000);
  });
});

describe('Expense lifecycle (task-156-161, UC-FIN-003)', () => {
  it('rejects updating a submitted expense', async () => {
    const { createAccountUseCase, createExpenseUseCase, submitExpenseUseCase, updateExpenseUseCase } = buildSut();
    const { expenseLedger } = await seedLedgerAccounts(createAccountUseCase);
    const expense = await createExpenseUseCase.execute({
      branchId: 'branch-1',
      expenseDate: '2026-07-31',
      category: 'utility',
      expenseAccountId: expenseLedger.id,
      amount: 500000,
      actorUserId: 'staff-1',
    });
    await submitExpenseUseCase.execute({ expenseId: expense.id, actorUserId: 'staff-1' });

    await expect(
      updateExpenseUseCase.execute({ expenseId: expense.id, amount: 600000, actorUserId: 'staff-1' }),
    ).rejects.toBeInstanceOf(ExpenseNotInStatusException);
  });

  it('rejects self-approval and requires a reason for rejection', async () => {
    const { createAccountUseCase, createExpenseUseCase, submitExpenseUseCase, approveExpenseUseCase, rejectExpenseUseCase } = buildSut();
    const { expenseLedger } = await seedLedgerAccounts(createAccountUseCase);
    const expense = await createExpenseUseCase.execute({
      branchId: 'branch-1',
      expenseDate: '2026-07-31',
      category: 'utility',
      expenseAccountId: expenseLedger.id,
      amount: 500000,
      actorUserId: 'staff-1',
    });
    await submitExpenseUseCase.execute({ expenseId: expense.id, actorUserId: 'staff-1' });

    await expect(approveExpenseUseCase.execute({ expenseId: expense.id, actorUserId: 'staff-1' })).rejects.toBeInstanceOf(
      ExpenseSegregationOfDutiesException,
    );

    const rejected = await rejectExpenseUseCase.execute({ expenseId: expense.id, reason: 'over budget', actorUserId: 'manager-1' });
    expect(rejected.status).toBe('REJECTED');
    expect(rejected.rejectionReason).toBe('over budget');
  });

  it('rejects paying an expense that is not approved', async () => {
    const { createAccountUseCase, createCashAccountUseCase, createExpenseUseCase, payExpenseUseCase } = buildSut();
    const { cashLedger, expenseLedger } = await seedLedgerAccounts(createAccountUseCase);
    const cash = await createCashAccountUseCase.execute({
      branchId: 'branch-1',
      code: 'CASH-1',
      name: 'Kas Utama',
      accountType: 'cash',
      ledgerAccountId: cashLedger.id,
      actorUserId: 'staff-1',
    });
    const expense = await createExpenseUseCase.execute({
      branchId: 'branch-1',
      expenseDate: '2026-07-31',
      category: 'utility',
      expenseAccountId: expenseLedger.id,
      amount: 500000,
      actorUserId: 'staff-1',
    });

    await expect(
      payExpenseUseCase.execute({
        expenseId: expense.id,
        cashAccountId: cash.id,
        paymentDate: '2026-07-31',
        amount: 500000,
        actorUserId: 'manager-1',
      }),
    ).rejects.toBeInstanceOf(ExpenseNotApprovedException);
  });

  it('rejects a payment exceeding the approved amount', async () => {
    const { createAccountUseCase, createPeriodUseCase, createCashAccountUseCase, createExpenseUseCase, submitExpenseUseCase, approveExpenseUseCase, payExpenseUseCase } =
      buildSut();
    const { cashLedger, expenseLedger } = await seedLedgerAccounts(createAccountUseCase);
    await createPeriodUseCase.execute({
      branchId: 'branch-1',
      periodName: 'Juli 2026',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      actorUserId: 'manager-1',
    });
    const cash = await createCashAccountUseCase.execute({
      branchId: 'branch-1',
      code: 'CASH-1',
      name: 'Kas Utama',
      accountType: 'cash',
      ledgerAccountId: cashLedger.id,
      actorUserId: 'staff-1',
    });
    const expense = await createExpenseUseCase.execute({
      branchId: 'branch-1',
      expenseDate: '2026-07-31',
      category: 'utility',
      expenseAccountId: expenseLedger.id,
      amount: 500000,
      actorUserId: 'staff-1',
    });
    await submitExpenseUseCase.execute({ expenseId: expense.id, actorUserId: 'staff-1' });
    await approveExpenseUseCase.execute({ expenseId: expense.id, approvedAmount: 400000, actorUserId: 'manager-1' });

    await expect(
      payExpenseUseCase.execute({
        expenseId: expense.id,
        cashAccountId: cash.id,
        paymentDate: '2026-07-31',
        amount: 500000,
        actorUserId: 'manager-1',
      }),
    ).rejects.toBeInstanceOf(ExpensePaymentExceedsApprovedException);
  });

  it('pays an approved expense, posting a journal and decrementing the cash balance', async () => {
    const {
      cashAccountRepository,
      createAccountUseCase,
      createPeriodUseCase,
      createCashAccountUseCase,
      createExpenseUseCase,
      submitExpenseUseCase,
      approveExpenseUseCase,
      payExpenseUseCase,
    } = buildSut();
    const { cashLedger, expenseLedger } = await seedLedgerAccounts(createAccountUseCase);
    await createPeriodUseCase.execute({
      branchId: 'branch-1',
      periodName: 'Juli 2026',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      actorUserId: 'manager-1',
    });
    const cash = await createCashAccountUseCase.execute({
      branchId: 'branch-1',
      code: 'CASH-1',
      name: 'Kas Utama',
      accountType: 'cash',
      ledgerAccountId: cashLedger.id,
      actorUserId: 'staff-1',
    });
    const expense = await createExpenseUseCase.execute({
      branchId: 'branch-1',
      expenseDate: '2026-07-31',
      category: 'utility',
      expenseAccountId: expenseLedger.id,
      amount: 500000,
      actorUserId: 'staff-1',
    });
    await submitExpenseUseCase.execute({ expenseId: expense.id, actorUserId: 'staff-1' });
    await approveExpenseUseCase.execute({ expenseId: expense.id, actorUserId: 'manager-1' });

    const paid = await payExpenseUseCase.execute({
      expenseId: expense.id,
      cashAccountId: cash.id,
      paymentDate: '2026-07-31',
      amount: 500000,
      actorUserId: 'manager-1',
    });
    expect(paid.status).toBe('PAID');
    expect(paid.paymentJournalId).not.toBeNull();

    const cashAccount = cashAccountRepository.cashAccounts.get(cash.id);
    expect(Number(cashAccount?.currentBalance)).toBe(-500000);
  });
});
