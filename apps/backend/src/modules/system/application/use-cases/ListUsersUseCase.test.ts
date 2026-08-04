import { ListUsersUseCase } from './ListUsersUseCase';
import { FakeUserAdminRepository, FakeUserRoleRepository, FakeRoleRepository, FakeUserBranchRepository, buildRole } from '../../../../../tests/fakes/systemFakes';

const query = { page: 1, limit: 20, sort: 'createdAt', order: 'desc' as const };

describe('task-214: ListUsersUseCase branch scoping', () => {
  it('an Administrator (cross-branch role) unfiltered request returns users across all branches', async () => {
    const userAdminRepository = new FakeUserAdminRepository();
    const roleRepository = new FakeRoleRepository();
    const userRoleRepository = new FakeUserRoleRepository(roleRepository);
    const userBranchRepository = new FakeUserBranchRepository();
    const admin = await userAdminRepository.create({ username: 'admin', email: 'admin@x.com', passwordHash: 'x' });
    const staffA = await userAdminRepository.create({ username: 'staffA', email: 'a@x.com', passwordHash: 'x' });
    const staffB = await userAdminRepository.create({ username: 'staffB', email: 'b@x.com', passwordHash: 'x' });
    userAdminRepository.seedBranchAssignments(staffA.id, ['branch-a']);
    userAdminRepository.seedBranchAssignments(staffB.id, ['branch-b']);
    const adminRole = buildRole({ roleCode: 'ADMINISTRATOR', isCrossBranch: true });
    roleRepository.seed(adminRole);
    await userRoleRepository.assignRoles(admin.id, [adminRole.id]);
    const useCase = new ListUsersUseCase(userAdminRepository, userRoleRepository, userBranchRepository);

    const result = await useCase.execute({ query, requesterUserId: admin.id });

    expect(result.items.map((u) => u.username).sort()).toEqual(['admin', 'staffA', 'staffB']);
  });

  it("a Clinic Manager's unfiltered request is intersected with their own assigned branch(es)", async () => {
    const userAdminRepository = new FakeUserAdminRepository();
    const roleRepository = new FakeRoleRepository();
    const userRoleRepository = new FakeUserRoleRepository(roleRepository);
    const userBranchRepository = new FakeUserBranchRepository();
    const manager = await userAdminRepository.create({ username: 'manager', email: 'manager@x.com', passwordHash: 'x' });
    const staffA = await userAdminRepository.create({ username: 'staffA', email: 'a@x.com', passwordHash: 'x' });
    const staffB = await userAdminRepository.create({ username: 'staffB', email: 'b@x.com', passwordHash: 'x' });
    userAdminRepository.seedBranchAssignments(staffA.id, ['branch-a']);
    userAdminRepository.seedBranchAssignments(staffB.id, ['branch-b']);
    const managerRole = buildRole({ roleCode: 'CLINIC_MANAGER', isCrossBranch: false });
    roleRepository.seed(managerRole);
    await userRoleRepository.assignRoles(manager.id, [managerRole.id]);
    await userBranchRepository.replaceAssignments(manager.id, [{ branchId: 'branch-a', isDefault: true }], 'admin-1');
    const useCase = new ListUsersUseCase(userAdminRepository, userRoleRepository, userBranchRepository);

    const result = await useCase.execute({ query, requesterUserId: manager.id });

    expect(result.items.map((u) => u.username)).toEqual(['staffA']);
  });
});
