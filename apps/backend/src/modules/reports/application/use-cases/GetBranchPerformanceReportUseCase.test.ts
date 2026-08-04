import { GetBranchPerformanceReportUseCase } from './GetBranchPerformanceReportUseCase';
import { QueueDashboardUseCase } from '../../../queue/application/use-cases/QueueDashboardUseCase';
import { BranchAuthorizationService } from '../services/BranchAuthorizationService';
import { FakeQueueRepository } from '../../../../../tests/fakes/queueFakes';
import { FakePaymentRepository } from '../../../../../tests/fakes/billingFakes';
import { FakeUserRoleRepository, FakeUserBranchRepository, FakeRoleRepository, buildRole } from '../../../../../tests/fakes/systemFakes';
import { ReportFilterInvalidException, ReportRangeTooLargeException, ReportScopeForbiddenException } from '../../domain/exceptions/ReportExceptions';

function buildSut() {
  const queueRepository = new FakeQueueRepository();
  const paymentRepository = new FakePaymentRepository();
  const roleRepository = new FakeRoleRepository();
  const userRoleRepository = new FakeUserRoleRepository(roleRepository);
  const userBranchRepository = new FakeUserBranchRepository();
  const useCase = new GetBranchPerformanceReportUseCase(
    new QueueDashboardUseCase(queueRepository),
    paymentRepository,
    new BranchAuthorizationService(userRoleRepository, userBranchRepository),
  );
  return { useCase, roleRepository, userRoleRepository, userBranchRepository };
}

async function seedCrossBranchRequester(roleRepository: FakeRoleRepository, userRoleRepository: FakeUserRoleRepository) {
  const adminRole = buildRole({ roleCode: 'ADMINISTRATOR', isCrossBranch: true });
  roleRepository.seed(adminRole);
  await userRoleRepository.assignRoles('admin-1', [adminRole.id]);
}

describe('task-220: GetBranchPerformanceReportUseCase', () => {
  it('returns one trended entry per day in the requested range, distinct from a point-in-time comparison', async () => {
    const { useCase, roleRepository, userRoleRepository } = buildSut();
    await seedCrossBranchRequester(roleRepository, userRoleRepository);

    const result = await useCase.execute('branch-a', 'admin-1', '2026-08-01', '2026-08-03');

    expect(result.map((entry) => entry.date)).toEqual(['2026-08-01', '2026-08-02', '2026-08-03']);
  });

  it('rejects a date range exceeding the synchronous policy limit', async () => {
    const { useCase, roleRepository, userRoleRepository } = buildSut();
    await seedCrossBranchRequester(roleRepository, userRoleRepository);

    await expect(useCase.execute('branch-a', 'admin-1', '2026-01-01', '2026-12-31')).rejects.toThrow(ReportRangeTooLargeException);
  });

  it('rejects an invalid date filter', async () => {
    const { useCase, roleRepository, userRoleRepository } = buildSut();
    await seedCrossBranchRequester(roleRepository, userRoleRepository);

    await expect(useCase.execute('branch-a', 'admin-1', 'not-a-date', '2026-08-03')).rejects.toThrow(ReportFilterInvalidException);
  });

  it('rejects a non-cross-branch requester targeting a branch outside their assignment', async () => {
    const { useCase, roleRepository, userRoleRepository } = buildSut();
    const managerRole = buildRole({ roleCode: 'CLINIC_MANAGER', isCrossBranch: false });
    roleRepository.seed(managerRole);
    await userRoleRepository.assignRoles('manager-1', [managerRole.id]);

    await expect(useCase.execute('branch-a', 'manager-1', '2026-08-01', '2026-08-02')).rejects.toThrow(ReportScopeForbiddenException);
  });
});
