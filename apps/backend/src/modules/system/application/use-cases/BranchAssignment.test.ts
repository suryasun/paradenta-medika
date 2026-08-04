import { AssignUserBranchUseCase } from './AssignUserBranchUseCase';
import { ListUserBranchesUseCase } from './ListUserBranchesUseCase';
import { FakeUserAdminRepository, FakeUserBranchRepository } from '../../../../../tests/fakes/systemFakes';
import { FakeAuditService, FakeSessionRepository } from '../../../../../tests/fakes/authFakes';
import { FakeBranchRepository } from '../../../../../tests/fakes/masterDataFakes';
import { BranchScopeInvalidException, SelfEscalationForbiddenException } from '../../domain/exceptions/SystemExceptions';
import { AuthorizationException, NotFoundException } from '../../../../shared/http/exceptions';

function buildDeps() {
  const userAdminRepository = new FakeUserAdminRepository();
  const branchRepository = new FakeBranchRepository();
  const userBranchRepository = new FakeUserBranchRepository();
  const sessionRepository = new FakeSessionRepository();
  const auditService = new FakeAuditService();
  return { userAdminRepository, branchRepository, userBranchRepository, sessionRepository, auditService };
}

describe('task-210/211: Branch Assignment Foundation', () => {
  it('assigns branches with exactly one default and lists them back', async () => {
    const { userAdminRepository, branchRepository, userBranchRepository, sessionRepository, auditService } = buildDeps();
    const user = await userAdminRepository.create({ username: 'jdoe', email: 'jdoe@example.com', passwordHash: 'x' });
    const branchA = await branchRepository.create({ clinicId: 'clinic-1', branchCode: 'BR-A', branchName: 'Branch A', phone: '021', email: 'a@x.com', address: 'Jl. A' });
    const branchB = await branchRepository.create({ clinicId: 'clinic-1', branchCode: 'BR-B', branchName: 'Branch B', phone: '021', email: 'b@x.com', address: 'Jl. B' });
    const assignUseCase = new AssignUserBranchUseCase(userAdminRepository, branchRepository, userBranchRepository, sessionRepository, auditService);
    const listUseCase = new ListUserBranchesUseCase(userAdminRepository, userBranchRepository);

    await assignUseCase.execute({
      userId: user.id,
      branchAssignments: [
        { branchId: branchA.id, isDefault: true },
        { branchId: branchB.id, isDefault: false },
      ],
      actorUserId: 'admin-1',
    });

    const assignments = await listUseCase.execute({ userId: user.id, requesterUserId: 'admin-1', requesterPermissionKeys: ['system.user.read'] });
    expect(assignments).toHaveLength(2);
    expect(assignments.find((a) => a.branchId === branchA.id)?.isDefault).toBe(true);
    expect(auditService.records).toHaveLength(1);
    expect(sessionRepository.sessions.size).toBe(0);
  });

  it('rejects a payload with zero or more than one default branch', async () => {
    const { userAdminRepository, branchRepository, userBranchRepository, sessionRepository, auditService } = buildDeps();
    const user = await userAdminRepository.create({ username: 'jdoe', email: 'jdoe@example.com', passwordHash: 'x' });
    const branchA = await branchRepository.create({ clinicId: 'clinic-1', branchCode: 'BR-A', branchName: 'Branch A', phone: '021', email: 'a@x.com', address: 'Jl. A' });
    const useCase = new AssignUserBranchUseCase(userAdminRepository, branchRepository, userBranchRepository, sessionRepository, auditService);

    await expect(
      useCase.execute({ userId: user.id, branchAssignments: [{ branchId: branchA.id, isDefault: false }], actorUserId: 'admin-1' }),
    ).rejects.toThrow(BranchScopeInvalidException);
  });

  it('rejects an inactive or non-existent branchId with SYS_BRANCH_SCOPE_INVALID', async () => {
    const { userAdminRepository, branchRepository, userBranchRepository, sessionRepository, auditService } = buildDeps();
    const user = await userAdminRepository.create({ username: 'jdoe', email: 'jdoe@example.com', passwordHash: 'x' });
    const useCase = new AssignUserBranchUseCase(userAdminRepository, branchRepository, userBranchRepository, sessionRepository, auditService);

    await expect(
      useCase.execute({ userId: user.id, branchAssignments: [{ branchId: 'missing-branch', isDefault: true }], actorUserId: 'admin-1' }),
    ).rejects.toThrow(BranchScopeInvalidException);
  });

  it('rejects self-escalation: a user cannot change their own branch assignments', async () => {
    const { userAdminRepository, branchRepository, userBranchRepository, sessionRepository, auditService } = buildDeps();
    const user = await userAdminRepository.create({ username: 'jdoe', email: 'jdoe@example.com', passwordHash: 'x' });
    const branchA = await branchRepository.create({ clinicId: 'clinic-1', branchCode: 'BR-A', branchName: 'Branch A', phone: '021', email: 'a@x.com', address: 'Jl. A' });
    const useCase = new AssignUserBranchUseCase(userAdminRepository, branchRepository, userBranchRepository, sessionRepository, auditService);

    await expect(
      useCase.execute({ userId: user.id, branchAssignments: [{ branchId: branchA.id, isDefault: true }], actorUserId: user.id }),
    ).rejects.toThrow(SelfEscalationForbiddenException);
  });

  it('a user can always read their own branch list regardless of system.user.read', async () => {
    const { userAdminRepository, userBranchRepository } = buildDeps();
    const user = await userAdminRepository.create({ username: 'jdoe', email: 'jdoe@example.com', passwordHash: 'x' });
    const listUseCase = new ListUserBranchesUseCase(userAdminRepository, userBranchRepository);

    await expect(listUseCase.execute({ userId: user.id, requesterUserId: user.id, requesterPermissionKeys: [] })).resolves.toEqual([]);
  });

  it('rejects reading another user branch list without system.user.read', async () => {
    const { userAdminRepository, userBranchRepository } = buildDeps();
    const user = await userAdminRepository.create({ username: 'jdoe', email: 'jdoe@example.com', passwordHash: 'x' });
    const listUseCase = new ListUserBranchesUseCase(userAdminRepository, userBranchRepository);

    await expect(listUseCase.execute({ userId: user.id, requesterUserId: 'other-user', requesterPermissionKeys: [] })).rejects.toThrow(
      AuthorizationException,
    );
  });

  it('rejects assignment for a non-existent user', async () => {
    const { userAdminRepository, branchRepository, userBranchRepository, sessionRepository, auditService } = buildDeps();
    const branchA = await branchRepository.create({ clinicId: 'clinic-1', branchCode: 'BR-A', branchName: 'Branch A', phone: '021', email: 'a@x.com', address: 'Jl. A' });
    const useCase = new AssignUserBranchUseCase(userAdminRepository, branchRepository, userBranchRepository, sessionRepository, auditService);

    await expect(
      useCase.execute({ userId: 'missing-user', branchAssignments: [{ branchId: branchA.id, isDefault: true }], actorUserId: 'admin-1' }),
    ).rejects.toThrow(NotFoundException);
  });
});
