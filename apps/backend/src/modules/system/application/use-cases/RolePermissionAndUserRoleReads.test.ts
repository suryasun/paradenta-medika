import { GetUserUseCase } from './GetUserUseCase';
import { GetRolePermissionsUseCase } from './GetRolePermissionsUseCase';
import { AssignRoleToUserUseCase } from './AssignRoleToUserUseCase';
import { AssignPermissionsToRoleUseCase } from './AssignPermissionsToRoleUseCase';
import {
  FakePermissionRepository,
  FakeRoleRepository,
  FakeRolePermissionRepository,
  FakeUserAdminRepository,
  FakeUserRoleRepository,
  buildPermission,
  buildRole,
} from '../../../../../tests/fakes/systemFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { RoleNotFoundException, UserNotFoundException } from '../../domain/exceptions/SystemExceptions';

// Both use cases here close a real pre-population gap: the frontend's
// Role-Permissions modal and User-Detail role checkboxes previously
// opened blank because no GET endpoint returned a role's/user's current
// grants (docs/03-sad/21-module-system.md Section 6.1 addendum).
describe('Role permissions + User roles read (post-launch addendum)', () => {
  it("GetUserUseCase returns the user's currently-assigned role ids", async () => {
    const userAdminRepository = new FakeUserAdminRepository();
    const roleRepository = new FakeRoleRepository();
    const userRoleRepository = new FakeUserRoleRepository(roleRepository);
    const auditService = new FakeAuditService();
    const user = await userAdminRepository.create({ username: 'jdoe', email: 'jdoe@example.com', passwordHash: 'x' });
    const role = buildRole({ roleCode: 'CASHIER' });
    roleRepository.seed(role);
    await new AssignRoleToUserUseCase(userAdminRepository, roleRepository, userRoleRepository, auditService).execute({
      userId: user.id,
      roleIds: [role.id],
      actorUserId: 'admin-1',
    });

    const getUserUseCase = new GetUserUseCase(userAdminRepository, userRoleRepository);
    const result = await getUserUseCase.execute(user.id);

    expect(result.roleIds).toEqual([role.id]);
    await expect(getUserUseCase.execute('unknown-id')).rejects.toBeInstanceOf(UserNotFoundException);
  });

  it("GetRolePermissionsUseCase returns the role's currently-assigned permissions, 404s on unknown role", async () => {
    const roleRepository = new FakeRoleRepository();
    const permissionRepository = new FakePermissionRepository();
    const rolePermissionRepository = new FakeRolePermissionRepository(permissionRepository);
    const auditService = new FakeAuditService();
    const role = buildRole({ roleCode: 'CASHIER' });
    roleRepository.seed(role);
    const permission = buildPermission({ permissionKey: 'billing.invoice.read' });
    permissionRepository.seed(permission);
    await new AssignPermissionsToRoleUseCase(roleRepository, permissionRepository, rolePermissionRepository, auditService).execute({
      roleId: role.id,
      permissionIds: [permission.id],
      actorUserId: 'admin-1',
    });

    const getRolePermissionsUseCase = new GetRolePermissionsUseCase(roleRepository, rolePermissionRepository);
    const permissions = await getRolePermissionsUseCase.execute(role.id);

    expect(permissions.map((p) => p.permissionKey)).toEqual(['billing.invoice.read']);
    await expect(getRolePermissionsUseCase.execute('unknown-id')).rejects.toBeInstanceOf(RoleNotFoundException);
  });
});
