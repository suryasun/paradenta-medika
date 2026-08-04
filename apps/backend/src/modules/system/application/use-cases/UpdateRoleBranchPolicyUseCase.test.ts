import { UpdateRoleBranchPolicyUseCase } from './UpdateRoleBranchPolicyUseCase';
import { FakeRoleRepository, buildRole } from '../../../../../tests/fakes/systemFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { RoleSystemProtectedException, RoleNotFoundException } from '../../domain/exceptions/SystemExceptions';

describe('task-217: UpdateRoleBranchPolicyUseCase', () => {
  it('flips isCrossBranch on a non-built-in role and records an audit entry', async () => {
    const roleRepository = new FakeRoleRepository();
    const auditService = new FakeAuditService();
    const role = buildRole({ roleCode: 'CLINIC_MANAGER', isSystem: false, isCrossBranch: false });
    roleRepository.seed(role);
    const useCase = new UpdateRoleBranchPolicyUseCase(roleRepository, auditService);

    const updated = await useCase.execute({ roleId: role.id, isCrossBranch: true, actorUserId: 'admin-1' });

    expect(updated.isCrossBranch).toBe(true);
    expect(auditService.records).toHaveLength(1);
  });

  it('rejects changing a built-in role with SYS_ROLE_SYSTEM_PROTECTED', async () => {
    const roleRepository = new FakeRoleRepository();
    const auditService = new FakeAuditService();
    const role = buildRole({ roleCode: 'ADMINISTRATOR', isSystem: true, isCrossBranch: true });
    roleRepository.seed(role);
    const useCase = new UpdateRoleBranchPolicyUseCase(roleRepository, auditService);

    await expect(useCase.execute({ roleId: role.id, isCrossBranch: false, actorUserId: 'admin-1' })).rejects.toThrow(
      RoleSystemProtectedException,
    );
  });

  it('rejects a non-existent role', async () => {
    const roleRepository = new FakeRoleRepository();
    const auditService = new FakeAuditService();
    const useCase = new UpdateRoleBranchPolicyUseCase(roleRepository, auditService);

    await expect(useCase.execute({ roleId: 'missing', isCrossBranch: true, actorUserId: 'admin-1' })).rejects.toThrow(
      RoleNotFoundException,
    );
  });
});
