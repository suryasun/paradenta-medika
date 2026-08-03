import { QueryAuditLogsUseCase } from './QueryAuditLogsUseCase';
import { QueryActivityLogsUseCase } from './QueryActivityLogsUseCase';
import { FakeActivityLogRepository, FakeAuditLogRepository } from '../../../../../tests/fakes/systemFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';

function baseQuery() {
  return { page: 1, limit: 20, sort: 'createdAt', order: 'desc' as const };
}

describe('Audit and Activity Log Query (task-192/193, UC-SYS-006)', () => {
  it('filters audit logs by actor/entity/action/date range', async () => {
    const auditLogRepository = new FakeAuditLogRepository();
    const auditService = new FakeAuditService();
    auditLogRepository.logs.push(
      {
        id: '1',
        entity: 'Journal',
        entityId: 'j-1',
        action: 'UPDATE',
        oldValue: null,
        newValue: '{"status":"POSTED"}',
        userId: 'u1',
        ipAddress: '127.0.0.1',
        correlationId: 'c-1',
        createdAt: new Date('2026-08-01'),
      } as never,
      {
        id: '2',
        entity: 'Account',
        entityId: 'a-1',
        action: 'CREATE',
        oldValue: null,
        newValue: null,
        userId: 'u2',
        ipAddress: null,
        correlationId: null,
        createdAt: new Date('2026-08-02'),
      } as never,
    );

    const useCase = new QueryAuditLogsUseCase(auditLogRepository, auditService);
    const result = await useCase.execute({ ...baseQuery(), actorUserId: 'u1' }, { userId: 'admin-1' });

    expect(result.total).toBe(1);
    expect(result.items[0].entity).toBe('Journal');
    expect(result.items[0].newValue).toEqual({ status: 'POSTED' });
  });

  it('records the audit query itself as an audit event (UC-SYS-006)', async () => {
    const auditLogRepository = new FakeAuditLogRepository();
    const auditService = new FakeAuditService();
    const useCase = new QueryAuditLogsUseCase(auditLogRepository, auditService);

    await useCase.execute(baseQuery(), { userId: 'admin-1', correlationId: 'corr-1' });

    expect(auditService.records).toHaveLength(1);
    expect(auditService.records[0]).toMatchObject({ entity: 'AuditLog', action: 'READ', context: { userId: 'admin-1' } });
  });

  it('queries activity logs filtered by module/branch', async () => {
    const activityLogRepository = new FakeActivityLogRepository();
    activityLogRepository.logs.push(
      {
        id: '1',
        actorUserId: 'u1',
        module: 'finance',
        action: 'JOURNAL_POSTED',
        target: 'journal-1',
        branchId: 'branch-1',
        message: 'Journal posted',
        createdAt: new Date(),
      } as never,
      {
        id: '2',
        actorUserId: 'u1',
        module: 'warehouse',
        action: 'STOCK_ADJUSTED',
        target: 'adj-1',
        branchId: 'branch-2',
        message: 'Stock adjusted',
        createdAt: new Date(),
      } as never,
    );

    const useCase = new QueryActivityLogsUseCase(activityLogRepository);
    const result = await useCase.execute({ ...baseQuery(), module: 'finance' });

    expect(result.total).toBe(1);
    expect(result.items[0].module).toBe('finance');
  });
});
