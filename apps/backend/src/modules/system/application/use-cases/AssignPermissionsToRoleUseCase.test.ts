import { AssignPermissionsToRoleUseCase } from './AssignPermissionsToRoleUseCase';
import { PermissionAssignmentInvalidException, RoleNotFoundException } from '../../domain/exceptions/SystemExceptions';
import {
  FakePermissionRepository,
  FakeRolePermissionRepository,
  FakeRoleRepository,
  buildPermission,
  buildRole,
} from '../../../../../tests/fakes/systemFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';

describe('AssignPermissionsToRoleUseCase', () => {
  function buildSut() {
    const roleRepository = new FakeRoleRepository();
    const permissionRepository = new FakePermissionRepository();
    const rolePermissionRepository = new FakeRolePermissionRepository(permissionRepository);
    const auditService = new FakeAuditService();
    const useCase = new AssignPermissionsToRoleUseCase(roleRepository, permissionRepository, rolePermissionRepository, auditService);
    return { roleRepository, permissionRepository, rolePermissionRepository, auditService, useCase };
  }

  it('assigning a permission to a role makes it appear in the resolved permission set', async () => {
    const { roleRepository, permissionRepository, rolePermissionRepository, useCase } = buildSut();
    const role = buildRole();
    const permission = buildPermission({ permissionKey: 'patient.create' });
    roleRepository.seed(role);
    permissionRepository.seed(permission);

    await useCase.execute({ roleId: role.id, permissionIds: [permission.id], actorUserId: 'admin-1' });

    const resolved = await rolePermissionRepository.getPermissionsForRole(role.id);
    expect(resolved.map((p) => p.permissionKey)).toEqual(['patient.create']);
  });

  it('rejects an unknown role', async () => {
    const { useCase } = buildSut();

    await expect(useCase.execute({ roleId: 'missing-role', permissionIds: [], actorUserId: 'admin-1' })).rejects.toBeInstanceOf(
      RoleNotFoundException,
    );
  });

  it('rejects an unknown permission id', async () => {
    const { roleRepository, useCase } = buildSut();
    const role = buildRole();
    roleRepository.seed(role);

    await expect(
      useCase.execute({ roleId: role.id, permissionIds: ['unknown-permission'], actorUserId: 'admin-1' }),
    ).rejects.toBeInstanceOf(PermissionAssignmentInvalidException);
  });
});
