import { GetBranchDashboardUseCase } from './GetBranchDashboardUseCase';
import { QueueDashboardUseCase } from '../../../queue/application/use-cases/QueueDashboardUseCase';
import { DashboardMetricAssembler } from '../services/DashboardMetricAssembler';
import { BranchAuthorizationService } from '../services/BranchAuthorizationService';
import { FakeQueueRepository } from '../../../../../tests/fakes/queueFakes';
import { FakeDashboardSummaryRepository } from '../../../../../tests/fakes/reportsFakes';
import { FakeBranchRepository } from '../../../../../tests/fakes/masterDataFakes';
import { FakeUserRoleRepository, FakeUserBranchRepository, FakeRoleRepository, buildRole } from '../../../../../tests/fakes/systemFakes';
import { ReportScopeForbiddenException } from '../../domain/exceptions/ReportExceptions';

function buildSut() {
  const queueRepository = new FakeQueueRepository();
  const dashboardSummaryRepository = new FakeDashboardSummaryRepository();
  const branchRepository = new FakeBranchRepository();
  const roleRepository = new FakeRoleRepository();
  const userRoleRepository = new FakeUserRoleRepository(roleRepository);
  const userBranchRepository = new FakeUserBranchRepository();
  const useCase = new GetBranchDashboardUseCase(
    new QueueDashboardUseCase(queueRepository),
    new DashboardMetricAssembler(dashboardSummaryRepository, branchRepository),
    new BranchAuthorizationService(userRoleRepository, userBranchRepository),
  );
  return { useCase, roleRepository, userRoleRepository, userBranchRepository };
}

describe('task-218: GetBranchDashboardUseCase', () => {
  it('combines Queue and Billing summaries with dataAsOf/freshness for a branch the requester is assigned to', async () => {
    const { useCase, roleRepository, userRoleRepository, userBranchRepository } = buildSut();
    const managerRole = buildRole({ roleCode: 'CLINIC_MANAGER', isCrossBranch: false });
    roleRepository.seed(managerRole);
    await userRoleRepository.assignRoles('manager-1', [managerRole.id]);
    await userBranchRepository.replaceAssignments('manager-1', [{ branchId: 'branch-a', isDefault: true }], 'admin-1');

    const result = await useCase.execute('branch-a', 'manager-1');

    expect(result).toHaveProperty('queue');
    expect(result).toHaveProperty('billing');
    expect(result).toHaveProperty('dataAsOf');
    expect(result).toHaveProperty('freshness');
  });

  it('rejects a Clinic Manager requesting a branch outside their assignment (RPT_SCOPE_FORBIDDEN)', async () => {
    const { useCase, roleRepository, userRoleRepository, userBranchRepository } = buildSut();
    const managerRole = buildRole({ roleCode: 'CLINIC_MANAGER', isCrossBranch: false });
    roleRepository.seed(managerRole);
    await userRoleRepository.assignRoles('manager-1', [managerRole.id]);
    await userBranchRepository.replaceAssignments('manager-1', [{ branchId: 'branch-a', isDefault: true }], 'admin-1');

    await expect(useCase.execute('branch-b', 'manager-1')).rejects.toThrow(ReportScopeForbiddenException);
  });
});
