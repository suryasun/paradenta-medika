import { BranchAuthorizationService } from './BranchAuthorizationService';
import { FakeUserRoleRepository, FakeUserBranchRepository, FakeRoleRepository, buildRole } from '../../../../../tests/fakes/systemFakes';
import { ReportScopeForbiddenException } from '../../domain/exceptions/ReportExceptions';

describe('task-218/219/220: BranchAuthorizationService (TC-RPT-008)', () => {
  it('a cross-branch role is never blocked, even for a branch they are not individually assigned to', async () => {
    const roleRepository = new FakeRoleRepository();
    const userRoleRepository = new FakeUserRoleRepository(roleRepository);
    const userBranchRepository = new FakeUserBranchRepository();
    const adminRole = buildRole({ roleCode: 'ADMINISTRATOR', isCrossBranch: true });
    roleRepository.seed(adminRole);
    await userRoleRepository.assignRoles('admin-1', [adminRole.id]);
    const service = new BranchAuthorizationService(userRoleRepository, userBranchRepository);

    await expect(service.assertBranchInScope('admin-1', 'branch-z')).resolves.toBeUndefined();
    await expect(service.assertBranchesInScope('admin-1', ['branch-y', 'branch-z'])).resolves.toBeUndefined();
  });

  it('rejects a non-cross-branch requester targeting a branch outside their assignment', async () => {
    const roleRepository = new FakeRoleRepository();
    const userRoleRepository = new FakeUserRoleRepository(roleRepository);
    const userBranchRepository = new FakeUserBranchRepository();
    const managerRole = buildRole({ roleCode: 'CLINIC_MANAGER', isCrossBranch: false });
    roleRepository.seed(managerRole);
    await userRoleRepository.assignRoles('manager-1', [managerRole.id]);
    await userBranchRepository.replaceAssignments('manager-1', [{ branchId: 'branch-a', isDefault: true }], 'admin-1');
    const service = new BranchAuthorizationService(userRoleRepository, userBranchRepository);

    await expect(service.assertBranchInScope('manager-1', 'branch-b')).rejects.toThrow(ReportScopeForbiddenException);
  });

  it('rejects the whole multi-branch request when any one requested branch is outside authority', async () => {
    const roleRepository = new FakeRoleRepository();
    const userRoleRepository = new FakeUserRoleRepository(roleRepository);
    const userBranchRepository = new FakeUserBranchRepository();
    const managerRole = buildRole({ roleCode: 'CLINIC_MANAGER', isCrossBranch: false });
    roleRepository.seed(managerRole);
    await userRoleRepository.assignRoles('manager-1', [managerRole.id]);
    await userBranchRepository.replaceAssignments('manager-1', [{ branchId: 'branch-a', isDefault: true }], 'admin-1');
    const service = new BranchAuthorizationService(userRoleRepository, userBranchRepository);

    await expect(service.assertBranchesInScope('manager-1', ['branch-a', 'branch-b'])).rejects.toThrow(ReportScopeForbiddenException);
  });

  it('allows a multi-branch request entirely within a non-cross-branch requester assignment', async () => {
    const roleRepository = new FakeRoleRepository();
    const userRoleRepository = new FakeUserRoleRepository(roleRepository);
    const userBranchRepository = new FakeUserBranchRepository();
    const managerRole = buildRole({ roleCode: 'CLINIC_MANAGER', isCrossBranch: false });
    roleRepository.seed(managerRole);
    await userRoleRepository.assignRoles('manager-1', [managerRole.id]);
    await userBranchRepository.replaceAssignments('manager-1', [
      { branchId: 'branch-a', isDefault: true },
      { branchId: 'branch-b', isDefault: false },
    ], 'admin-1');
    const service = new BranchAuthorizationService(userRoleRepository, userBranchRepository);

    await expect(service.assertBranchesInScope('manager-1', ['branch-a', 'branch-b'])).resolves.toBeUndefined();
  });
});
