import { GetBranchComparisonReportUseCase } from './GetBranchComparisonReportUseCase';
import { DashboardMetricAssembler } from '../services/DashboardMetricAssembler';
import { BranchAuthorizationService } from '../services/BranchAuthorizationService';
import { FakeDashboardSummaryRepository } from '../../../../../tests/fakes/reportsFakes';
import { FakeBranchRepository } from '../../../../../tests/fakes/masterDataFakes';
import { FakeUserRoleRepository, FakeUserBranchRepository, FakeRoleRepository, buildRole } from '../../../../../tests/fakes/systemFakes';
import { ReportScopeForbiddenException } from '../../domain/exceptions/ReportExceptions';

function buildSut() {
  const dashboardSummaryRepository = new FakeDashboardSummaryRepository();
  const branchRepository = new FakeBranchRepository();
  const roleRepository = new FakeRoleRepository();
  const userRoleRepository = new FakeUserRoleRepository(roleRepository);
  const userBranchRepository = new FakeUserBranchRepository();
  const useCase = new GetBranchComparisonReportUseCase(
    new DashboardMetricAssembler(dashboardSummaryRepository, branchRepository),
    branchRepository,
    new BranchAuthorizationService(userRoleRepository, userBranchRepository),
  );
  return { useCase, branchRepository, roleRepository, userRoleRepository, userBranchRepository };
}

describe('task-219: GetBranchComparisonReportUseCase', () => {
  it('returns the same metric set per branch, side-by-side, for a cross-branch requester', async () => {
    const { useCase, branchRepository, roleRepository, userRoleRepository } = buildSut();
    const adminRole = buildRole({ roleCode: 'ADMINISTRATOR', isCrossBranch: true });
    roleRepository.seed(adminRole);
    await userRoleRepository.assignRoles('admin-1', [adminRole.id]);
    const branchA = await branchRepository.create({ clinicId: 'clinic-1', branchCode: 'BR-A', branchName: 'Branch A', phone: '021', email: 'a@x.com', address: 'Jl. A' });
    const branchB = await branchRepository.create({ clinicId: 'clinic-1', branchCode: 'BR-B', branchName: 'Branch B', phone: '021', email: 'b@x.com', address: 'Jl. B' });

    const result = await useCase.execute([branchA.id, branchB.id], 'admin-1');

    expect(result).toHaveLength(2);
    expect(result[0].metrics.map((m) => m.code)).toEqual(result[1].metrics.map((m) => m.code));
    expect(result.map((r) => r.branchName)).toEqual(['Branch A', 'Branch B']);
  });

  it('TC-RPT-008: rejects when any requested branch is outside a non-cross-branch requester scope', async () => {
    const { useCase, branchRepository, roleRepository, userRoleRepository, userBranchRepository } = buildSut();
    const managerRole = buildRole({ roleCode: 'CLINIC_MANAGER', isCrossBranch: false });
    roleRepository.seed(managerRole);
    await userRoleRepository.assignRoles('manager-1', [managerRole.id]);
    const branchA = await branchRepository.create({ clinicId: 'clinic-1', branchCode: 'BR-A', branchName: 'Branch A', phone: '021', email: 'a@x.com', address: 'Jl. A' });
    const branchB = await branchRepository.create({ clinicId: 'clinic-1', branchCode: 'BR-B', branchName: 'Branch B', phone: '021', email: 'b@x.com', address: 'Jl. B' });
    await userBranchRepository.replaceAssignments('manager-1', [{ branchId: branchA.id, isDefault: true }], 'admin-1');

    await expect(useCase.execute([branchA.id, branchB.id], 'manager-1')).rejects.toThrow(ReportScopeForbiddenException);
  });
});
