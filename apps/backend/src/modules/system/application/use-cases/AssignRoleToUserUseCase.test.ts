import { AssignRoleToUserUseCase } from './AssignRoleToUserUseCase';
import { FakeRoleRepository, FakeUserAdminRepository, FakeUserRoleRepository, buildRole } from '../../../../../tests/fakes/systemFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';

describe('AssignRoleToUserUseCase', () => {
  it("assigning a role to a user changes their resolved permission set (via role membership)", async () => {
    const userAdminRepository = new FakeUserAdminRepository();
    const roleRepository = new FakeRoleRepository();
    const userRoleRepository = new FakeUserRoleRepository(roleRepository);
    const auditService = new FakeAuditService();
    const user = await userAdminRepository.create({ username: 'jdoe', email: 'jdoe@example.com', passwordHash: 'x' });
    const role = buildRole({ roleCode: 'CASHIER' });
    roleRepository.seed(role);
    const useCase = new AssignRoleToUserUseCase(userAdminRepository, roleRepository, userRoleRepository, auditService);

    const roles = await useCase.execute({ userId: user.id, roleIds: [role.id], reason: 'Initial provisioning', actorUserId: 'admin-1' });

    expect(roles.map((r) => r.roleCode)).toEqual(['CASHIER']);
    expect(auditService.records).toHaveLength(1);
  });
});
