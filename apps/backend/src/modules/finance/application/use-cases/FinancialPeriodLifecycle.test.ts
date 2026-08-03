import { CreatePeriodUseCase } from './CreatePeriodUseCase';
import { ListPeriodsUseCase } from './ListPeriodsUseCase';
import { FakeFinancialPeriodRepository } from '../../../../../tests/fakes/financeFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { FinancialPeriodOverlapException } from '../../domain/exceptions/FinanceExceptions';

function buildSut() {
  const financialPeriodRepository = new FakeFinancialPeriodRepository();
  const auditService = new FakeAuditService();
  return {
    createUseCase: new CreatePeriodUseCase(financialPeriodRepository, auditService),
    listUseCase: new ListPeriodsUseCase(financialPeriodRepository),
  };
}

describe('Financial Period (task-168, folded into Epic AC)', () => {
  it('creates an open period', async () => {
    const { createUseCase } = buildSut();
    const period = await createUseCase.execute({
      branchId: 'branch-1',
      periodName: 'Juli 2026',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      actorUserId: 'manager-1',
    });
    expect(period.status).toBe('OPEN');
  });

  it('rejects a period whose date range overlaps an existing open period for the same branch', async () => {
    const { createUseCase } = buildSut();
    await createUseCase.execute({
      branchId: 'branch-1',
      periodName: 'Juli 2026',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      actorUserId: 'manager-1',
    });

    await expect(
      createUseCase.execute({
        branchId: 'branch-1',
        periodName: 'Overlapping period',
        startDate: '2026-07-15',
        endDate: '2026-08-15',
        actorUserId: 'manager-1',
      }),
    ).rejects.toBeInstanceOf(FinancialPeriodOverlapException);
  });

  it('allows non-overlapping periods for the same branch', async () => {
    const { createUseCase, listUseCase } = buildSut();
    await createUseCase.execute({
      branchId: 'branch-1',
      periodName: 'Juli 2026',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      actorUserId: 'manager-1',
    });
    await createUseCase.execute({
      branchId: 'branch-1',
      periodName: 'Agustus 2026',
      startDate: '2026-08-01',
      endDate: '2026-08-31',
      actorUserId: 'manager-1',
    });

    const { total } = await listUseCase.execute({ branchId: 'branch-1', page: 1, limit: 20, sort: 'createdAt', order: 'desc' });
    expect(total).toBe(2);
  });
});
