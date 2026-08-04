import { Request, Response } from 'express';
import { createBranchScopeGuard } from './branchScopeGuard';
import { FakeUserRoleRepository, FakeRoleRepository, FakeUserBranchRepository, buildRole } from '../../../../../tests/fakes/systemFakes';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { BranchOutOfScopeException } from '../../domain/exceptions/SystemExceptions';

function buildReq(userId: string | undefined, targetBranchId: string | undefined): Request {
  return { auth: userId ? { userId, username: 'u', sessionId: 's1', roleCodes: [], permissionKeys: [] } : undefined, query: { branchId: targetBranchId } } as unknown as Request;
}

describe('task-216: BranchScopeGuard', () => {
  it('rejects a non-cross-branch user targeting a branch outside their assignment', async () => {
    const roleRepository = new FakeRoleRepository();
    const userRoleRepository = new FakeUserRoleRepository(roleRepository);
    const userBranchRepository = new FakeUserBranchRepository();
    const staffRole = buildRole({ roleCode: 'CASHIER', isCrossBranch: false });
    roleRepository.seed(staffRole);
    await userRoleRepository.assignRoles('user-1', [staffRole.id]);
    await userBranchRepository.replaceAssignments('user-1', [{ branchId: 'branch-a', isDefault: true }], 'admin-1');
    const guard = createBranchScopeGuard(userRoleRepository, userBranchRepository, (req) => (req.query as { branchId?: string }).branchId);
    const next = jest.fn();

    await guard(buildReq('user-1', 'branch-b'), {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(BranchOutOfScopeException));
  });

  it('allows a non-cross-branch user targeting their own assigned branch', async () => {
    const roleRepository = new FakeRoleRepository();
    const userRoleRepository = new FakeUserRoleRepository(roleRepository);
    const userBranchRepository = new FakeUserBranchRepository();
    const staffRole = buildRole({ roleCode: 'CASHIER', isCrossBranch: false });
    roleRepository.seed(staffRole);
    await userRoleRepository.assignRoles('user-1', [staffRole.id]);
    await userBranchRepository.replaceAssignments('user-1', [{ branchId: 'branch-a', isDefault: true }], 'admin-1');
    const guard = createBranchScopeGuard(userRoleRepository, userBranchRepository, (req) => (req.query as { branchId?: string }).branchId);
    const next = jest.fn();

    await guard(buildReq('user-1', 'branch-a'), {} as Response, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('is not blocked for a cross-branch role, even for a branch they are not individually assigned to', async () => {
    const roleRepository = new FakeRoleRepository();
    const userRoleRepository = new FakeUserRoleRepository(roleRepository);
    const userBranchRepository = new FakeUserBranchRepository();
    const adminRole = buildRole({ roleCode: 'ADMINISTRATOR', isCrossBranch: true });
    roleRepository.seed(adminRole);
    await userRoleRepository.assignRoles('admin-1', [adminRole.id]);
    const guard = createBranchScopeGuard(userRoleRepository, userBranchRepository, (req) => (req.query as { branchId?: string }).branchId);
    const next = jest.fn();

    await guard(buildReq('admin-1', 'branch-z'), {} as Response, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('allows the request through when the extractor finds no explicit target branch', async () => {
    const roleRepository = new FakeRoleRepository();
    const userRoleRepository = new FakeUserRoleRepository(roleRepository);
    const userBranchRepository = new FakeUserBranchRepository();
    const guard = createBranchScopeGuard(userRoleRepository, userBranchRepository, (req) => (req.query as { branchId?: string }).branchId);
    const next = jest.fn();

    await guard(buildReq('user-1', undefined), {} as Response, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('rejects with 401 when unauthenticated', async () => {
    const roleRepository = new FakeRoleRepository();
    const userRoleRepository = new FakeUserRoleRepository(roleRepository);
    const userBranchRepository = new FakeUserBranchRepository();
    const guard = createBranchScopeGuard(userRoleRepository, userBranchRepository, (req) => (req.query as { branchId?: string }).branchId);
    const next = jest.fn();

    await guard(buildReq(undefined, 'branch-a'), {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(AuthenticationException));
  });
});
