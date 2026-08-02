import { CreateUserUseCase } from './CreateUserUseCase';
import { PasswordService } from '../../../auth/application/services/PasswordService';
import { PasswordPolicyException } from '../../../auth/domain/exceptions/AuthExceptions';
import { UserIdentifierExistsException } from '../../domain/exceptions/SystemExceptions';
import { FakeUserAdminRepository, FakeRoleRepository, FakeUserRoleRepository, buildRole } from '../../../../../tests/fakes/systemFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { testConfig } from '../../../../../tests/fakes/testConfig';

describe('CreateUserUseCase', () => {
  const passwordService = new PasswordService(testConfig());

  function buildSut() {
    const userAdminRepository = new FakeUserAdminRepository();
    const roleRepository = new FakeRoleRepository();
    const userRoleRepository = new FakeUserRoleRepository(roleRepository);
    const auditService = new FakeAuditService();
    const useCase = new CreateUserUseCase(userAdminRepository, roleRepository, userRoleRepository, passwordService, auditService);
    return { userAdminRepository, roleRepository, userRoleRepository, auditService, useCase };
  }

  it('rejects a policy-violating password', async () => {
    const { useCase } = buildSut();

    await expect(
      useCase.execute({ username: 'newdoc', email: 'newdoc@example.com', password: 'weak', actorUserId: 'admin-1' }),
    ).rejects.toBeInstanceOf(PasswordPolicyException);
  });

  it('rejects a duplicate username/email', async () => {
    const { userAdminRepository, useCase } = buildSut();
    userAdminRepository.seed(await userAdminRepository.create({ username: 'jdoe', email: 'jdoe@example.com', passwordHash: 'x' }));

    await expect(
      useCase.execute({ username: 'jdoe', email: 'other@example.com', password: 'Str0ng!Passw0rd', actorUserId: 'admin-1' }),
    ).rejects.toBeInstanceOf(UserIdentifierExistsException);
  });

  it('creates a user, hashes the password, assigns roles, and records an audit entry', async () => {
    const { userAdminRepository, roleRepository, userRoleRepository, auditService, useCase } = buildSut();
    const role = buildRole();
    roleRepository.seed(role);

    const user = await useCase.execute({
      username: 'newcashier',
      email: 'newcashier@example.com',
      password: 'Str0ng!Passw0rd',
      roleIds: [role.id],
      actorUserId: 'admin-1',
    });

    expect(user.username).toBe('newcashier');
    expect(user.passwordHash).not.toBe('Str0ng!Passw0rd');
    await expect(passwordService.verify('Str0ng!Passw0rd', user.passwordHash)).resolves.toBe(true);
    expect(userAdminRepository.users.has(user.id)).toBe(true);
    const assignedRoles = await userRoleRepository.listRolesForUser(user.id);
    expect(assignedRoles).toHaveLength(1);
    expect(auditService.records).toHaveLength(1);
  });
});
