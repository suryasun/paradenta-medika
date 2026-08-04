import { CreateAccountUseCase } from './CreateAccountUseCase';
import { CreatePeriodUseCase } from './CreatePeriodUseCase';
import { CreateCashAccountUseCase } from './CreateCashAccountUseCase';
import { CreateDailyClosingUseCase } from './CreateDailyClosingUseCase';
import { ApproveDailyClosingUseCase } from './ApproveDailyClosingUseCase';
import { GenerateDoctorFeeSettlementUseCase } from './GenerateDoctorFeeSettlementUseCase';
import { ApproveDoctorFeeSettlementUseCase } from './ApproveDoctorFeeSettlementUseCase';
import { PayDoctorFeeSettlementUseCase } from './PayDoctorFeeSettlementUseCase';
import { ListDoctorFeeSettlementUseCase } from './ListDoctorFeeSettlementUseCase';
import { GetDoctorFeeSettlementUseCase } from './GetDoctorFeeSettlementUseCase';
import { LockFinancialPeriodUseCase } from './LockFinancialPeriodUseCase';
import { CloseFinancialPeriodUseCase } from './CloseFinancialPeriodUseCase';
import { ReopenFinancialPeriodUseCase } from './ReopenFinancialPeriodUseCase';
import { JournalNumberGenerator } from '../services/JournalNumberGenerator';
import { DoctorFeeSettlementNumberGenerator } from '../services/DoctorFeeSettlementNumberGenerator';
import {
  FakeAccountRepository,
  FakeCashAccountRepository,
  FakeDailyClosingRepository,
  FakeDoctorFeeSettlementRepository,
  FakeFinancialPeriodRepository,
  FakeJournalRepository,
} from '../../../../../tests/fakes/financeFakes';
import { FakeVisitTreatmentRepository } from '../../../../../tests/fakes/emrFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { InMemoryEventBus } from '../../../../shared/events/EventBus';
import {
  DailyClosingDuplicateException,
  DailyClosingSegregationOfDutiesException,
  DailyClosingVarianceReasonRequiredException,
  DoctorFeeSettlementNotFoundException,
  FinancialPeriodNotInStatusException,
  SettlementNotApprovedException,
  SettlementSegregationOfDutiesException,
} from '../../domain/exceptions/FinanceExceptions';

function buildSut() {
  const accountRepository = new FakeAccountRepository();
  const journalRepository = new FakeJournalRepository();
  const financialPeriodRepository = new FakeFinancialPeriodRepository();
  const cashAccountRepository = new FakeCashAccountRepository();
  const dailyClosingRepository = new FakeDailyClosingRepository();
  const settlementRepository = new FakeDoctorFeeSettlementRepository();
  const visitTreatmentRepository = new FakeVisitTreatmentRepository();
  const auditService = new FakeAuditService();
  const eventBus = new InMemoryEventBus();

  return {
    accountRepository,
    cashAccountRepository,
    dailyClosingRepository,
    settlementRepository,
    visitTreatmentRepository,
    financialPeriodRepository,
    eventBus,
    createAccountUseCase: new CreateAccountUseCase(accountRepository, auditService),
    createPeriodUseCase: new CreatePeriodUseCase(financialPeriodRepository, auditService),
    createCashAccountUseCase: new CreateCashAccountUseCase(cashAccountRepository, accountRepository, auditService),
    createDailyClosingUseCase: new CreateDailyClosingUseCase(dailyClosingRepository, cashAccountRepository, auditService),
    approveDailyClosingUseCase: new ApproveDailyClosingUseCase(dailyClosingRepository, auditService, eventBus),
    generateSettlementUseCase: new GenerateDoctorFeeSettlementUseCase(
      settlementRepository,
      visitTreatmentRepository,
      accountRepository,
      new DoctorFeeSettlementNumberGenerator(settlementRepository),
      auditService,
    ),
    approveSettlementUseCase: new ApproveDoctorFeeSettlementUseCase(settlementRepository, auditService),
    paySettlementUseCase: new PayDoctorFeeSettlementUseCase(
      settlementRepository,
      cashAccountRepository,
      journalRepository,
      financialPeriodRepository,
      new JournalNumberGenerator(journalRepository),
      auditService,
    ),
    listSettlementUseCase: new ListDoctorFeeSettlementUseCase(settlementRepository),
    getSettlementUseCase: new GetDoctorFeeSettlementUseCase(settlementRepository),
    lockPeriodUseCase: new LockFinancialPeriodUseCase(financialPeriodRepository, auditService),
    closePeriodUseCase: new CloseFinancialPeriodUseCase(financialPeriodRepository, auditService, eventBus),
    reopenPeriodUseCase: new ReopenFinancialPeriodUseCase(financialPeriodRepository, auditService),
  };
}

describe('Daily Closing lifecycle (task-163-165, UC-FIN-005)', () => {
  async function seedCashAccount(sut: ReturnType<typeof buildSut>) {
    const ledger = await sut.createAccountUseCase.execute({
      code: '1110',
      name: 'Kas Utama',
      accountType: 'asset',
      normalBalance: 'debit',
      isPostable: true,
      actorUserId: 'manager-1',
    });
    return sut.createCashAccountUseCase.execute({
      branchId: 'branch-1',
      code: 'CASH-1',
      name: 'Kas Kecil',
      accountType: 'cash',
      ledgerAccountId: ledger.id,
      actorUserId: 'manager-1',
    });
  }

  it('requires a variance reason when counted balance differs from expected', async () => {
    const sut = buildSut();
    const cash = await seedCashAccount(sut);

    await expect(
      sut.createDailyClosingUseCase.execute({
        branchId: 'branch-1',
        cashAccountId: cash.id,
        cashierId: 'cashier-1',
        closingDate: '2026-07-31',
        countedBalance: 50000,
        actorUserId: 'cashier-1',
      }),
    ).rejects.toBeInstanceOf(DailyClosingVarianceReasonRequiredException);
  });

  it('rejects a duplicate closing for the same scope/date', async () => {
    const sut = buildSut();
    const cash = await seedCashAccount(sut);
    await sut.createDailyClosingUseCase.execute({
      branchId: 'branch-1',
      cashAccountId: cash.id,
      cashierId: 'cashier-1',
      closingDate: '2026-07-31',
      countedBalance: 0,
      actorUserId: 'cashier-1',
    });

    await expect(
      sut.createDailyClosingUseCase.execute({
        branchId: 'branch-1',
        cashAccountId: cash.id,
        cashierId: 'cashier-1',
        closingDate: '2026-07-31',
        countedBalance: 0,
        actorUserId: 'cashier-1',
      }),
    ).rejects.toBeInstanceOf(DailyClosingDuplicateException);
  });

  it('rejects self-approval and publishes the approved event', async () => {
    const sut = buildSut();
    let published: unknown = null;
    sut.eventBus.subscribe('finance.daily-closing.approved.v1', (p) => {
      published = p;
    });
    const cash = await seedCashAccount(sut);
    const closing = await sut.createDailyClosingUseCase.execute({
      branchId: 'branch-1',
      cashAccountId: cash.id,
      cashierId: 'cashier-1',
      closingDate: '2026-07-31',
      countedBalance: 0,
      actorUserId: 'cashier-1',
    });

    await expect(
      sut.approveDailyClosingUseCase.execute({ closingId: closing.id, actorUserId: 'cashier-1' }),
    ).rejects.toBeInstanceOf(DailyClosingSegregationOfDutiesException);

    const approved = await sut.approveDailyClosingUseCase.execute({ closingId: closing.id, actorUserId: 'manager-1' });
    expect(approved.status).toBe('APPROVED');
    expect(published).not.toBeNull();
  });
});

describe('Doctor Fee Settlement lifecycle (task-166-167, UC-FIN-006)', () => {
  async function seedFeeAccountAndCash(sut: ReturnType<typeof buildSut>) {
    const feeLedger = await sut.createAccountUseCase.execute({
      code: '6100',
      name: 'Doctor Fee Payable',
      accountType: 'expense',
      normalBalance: 'debit',
      isPostable: true,
      actorUserId: 'manager-1',
    });
    const cashLedger = await sut.createAccountUseCase.execute({
      code: '1110',
      name: 'Kas Utama',
      accountType: 'asset',
      normalBalance: 'debit',
      isPostable: true,
      actorUserId: 'manager-1',
    });
    const cash = await sut.createCashAccountUseCase.execute({
      branchId: 'branch-1',
      code: 'CASH-1',
      name: 'Kas Kecil',
      accountType: 'cash',
      ledgerAccountId: cashLedger.id,
      actorUserId: 'manager-1',
    });
    return { feeLedger, cash };
  }

  it('generates a settlement summing unsettled source lines and excludes previously-settled ones', async () => {
    const sut = buildSut();
    const { feeLedger } = await seedFeeAccountAndCash(sut);
    sut.visitTreatmentRepository.manualDoctorFeeSources = [
      { visitTreatmentId: 'vt-1', visitId: 'v-1', treatmentId: 't-1', quantity: 1, doctorFee: 50000, amount: 50000, visitDate: new Date('2026-07-10') },
      { visitTreatmentId: 'vt-2', visitId: 'v-2', treatmentId: 't-1', quantity: 2, doctorFee: 50000, amount: 100000, visitDate: new Date('2026-07-15') },
    ];

    const settlement = await sut.generateSettlementUseCase.execute({
      branchId: 'branch-1',
      doctorId: 'doctor-1',
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
      feeAccountId: feeLedger.id,
      actorUserId: 'staff-1',
    });
    expect(settlement.grossAmount).toBe(150000);
    expect(settlement.items).toHaveLength(2);

    // A second generate call must exclude the now-settled sources.
    const secondSettlement = await sut.generateSettlementUseCase.execute({
      branchId: 'branch-1',
      doctorId: 'doctor-1',
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
      feeAccountId: feeLedger.id,
      actorUserId: 'staff-1',
    });
    expect(secondSettlement.grossAmount).toBe(0);
    expect(secondSettlement.items).toHaveLength(0);
  });

  it('rejects self-approval and rejects paying an unapproved settlement', async () => {
    const sut = buildSut();
    const { feeLedger, cash } = await seedFeeAccountAndCash(sut);
    sut.visitTreatmentRepository.manualDoctorFeeSources = [
      { visitTreatmentId: 'vt-1', visitId: 'v-1', treatmentId: 't-1', quantity: 1, doctorFee: 75000, amount: 75000, visitDate: new Date('2026-07-10') },
    ];
    const settlement = await sut.generateSettlementUseCase.execute({
      branchId: 'branch-1',
      doctorId: 'doctor-1',
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
      feeAccountId: feeLedger.id,
      actorUserId: 'staff-1',
    });

    await expect(
      sut.approveSettlementUseCase.execute({ settlementId: settlement.id, actorUserId: 'staff-1' }),
    ).rejects.toBeInstanceOf(SettlementSegregationOfDutiesException);

    await expect(
      sut.paySettlementUseCase.execute({
        settlementId: settlement.id,
        cashAccountId: cash.id,
        paymentDate: '2026-07-31',
        actorUserId: 'manager-1',
      }),
    ).rejects.toBeInstanceOf(SettlementNotApprovedException);
  });

  it('pays an approved settlement, posting a balanced journal and decrementing the cash balance', async () => {
    const sut = buildSut();
    const { feeLedger, cash } = await seedFeeAccountAndCash(sut);
    await sut.createPeriodUseCase.execute({
      branchId: 'branch-1',
      periodName: 'Juli 2026',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      actorUserId: 'manager-1',
    });
    sut.visitTreatmentRepository.manualDoctorFeeSources = [
      { visitTreatmentId: 'vt-1', visitId: 'v-1', treatmentId: 't-1', quantity: 1, doctorFee: 75000, amount: 75000, visitDate: new Date('2026-07-10') },
    ];
    const settlement = await sut.generateSettlementUseCase.execute({
      branchId: 'branch-1',
      doctorId: 'doctor-1',
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
      feeAccountId: feeLedger.id,
      actorUserId: 'staff-1',
    });
    await sut.approveSettlementUseCase.execute({ settlementId: settlement.id, actorUserId: 'manager-1' });

    const paid = await sut.paySettlementUseCase.execute({
      settlementId: settlement.id,
      cashAccountId: cash.id,
      paymentDate: '2026-07-31',
      actorUserId: 'manager-1',
    });
    expect(paid.status).toBe('PAID');
    expect(paid.paymentJournalId).not.toBeNull();

    const cashAccount = sut.cashAccountRepository.cashAccounts.get(cash.id);
    expect(Number(cashAccount?.currentBalance)).toBe(-75000);
  });

  it('lists settlements filtered by doctor/status and fetches one by id, 404s on unknown id', async () => {
    const sut = buildSut();
    const { feeLedger } = await seedFeeAccountAndCash(sut);
    sut.visitTreatmentRepository.manualDoctorFeeSources = [
      { visitTreatmentId: 'vt-1', visitId: 'v-1', treatmentId: 't-1', quantity: 1, doctorFee: 50000, amount: 50000, visitDate: new Date('2026-07-10') },
    ];
    const settlement = await sut.generateSettlementUseCase.execute({
      branchId: 'branch-1',
      doctorId: 'doctor-1',
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
      feeAccountId: feeLedger.id,
      actorUserId: 'staff-1',
    });

    const { items, total } = await sut.listSettlementUseCase.execute({ page: 1, limit: 20, sort: 'createdAt', order: 'desc', doctorId: 'doctor-1' });
    expect(total).toBe(1);
    expect(items[0].id).toBe(settlement.id);

    const { total: otherDoctorTotal } = await sut.listSettlementUseCase.execute({ page: 1, limit: 20, sort: 'createdAt', order: 'desc', doctorId: 'doctor-2' });
    expect(otherDoctorTotal).toBe(0);

    const fetched = await sut.getSettlementUseCase.execute(settlement.id);
    expect(fetched.id).toBe(settlement.id);
    expect(fetched.grossAmount).toBe(50000);

    await expect(sut.getSettlementUseCase.execute('unknown-id')).rejects.toBeInstanceOf(DoctorFeeSettlementNotFoundException);
  });
});

describe('Financial Period Lock/Close/Reopen (task-169-171, UC-FIN-007)', () => {
  it('walks Open -> Locked -> Closed -> Open (reopen) and rejects out-of-sequence transitions', async () => {
    const sut = buildSut();
    let closedEvent: unknown = null;
    sut.eventBus.subscribe('finance.period.closed.v1', (p) => {
      closedEvent = p;
    });

    const period = await sut.createPeriodUseCase.execute({
      branchId: 'branch-1',
      periodName: 'Juli 2026',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      actorUserId: 'manager-1',
    });

    await expect(sut.closePeriodUseCase.execute({ periodId: period.id, actorUserId: 'manager-1' })).rejects.toBeInstanceOf(
      FinancialPeriodNotInStatusException,
    );

    const locked = await sut.lockPeriodUseCase.execute({ periodId: period.id, actorUserId: 'manager-1' });
    expect(locked.status).toBe('LOCKED');

    const closed = await sut.closePeriodUseCase.execute({ periodId: period.id, actorUserId: 'manager-1' });
    expect(closed.status).toBe('CLOSED');
    expect(closedEvent).not.toBeNull();

    const reopened = await sut.reopenPeriodUseCase.execute({
      periodId: period.id,
      reason: 'Correction needed for July closing',
      actorUserId: 'owner-1',
    });
    expect(reopened.status).toBe('OPEN');
    expect(reopened.reopenReason).toBe('Correction needed for July closing');
  });
});
