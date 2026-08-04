import { GetRoleBranchMatrixUseCase } from './GetRoleBranchMatrixUseCase';
import { FakeRoleRepository, FakeUserRoleRepository, FakeUserBranchRepository, buildRole } from '../../../../../tests/fakes/systemFakes';
import { FakeBranchRepository } from '../../../../../tests/fakes/masterDataFakes';

describe('task-215: GetRoleBranchMatrixUseCase', () => {
  it('reflects concurrent multi-branch, multi-role assignments for a single user', async () => {
    const roleRepository = new FakeRoleRepository();
    const branchRepository = new FakeBranchRepository();
    const userRoleRepository = new FakeUserRoleRepository(roleRepository);
    const userBranchRepository = new FakeUserBranchRepository();

    const doctorRole = buildRole({ roleCode: 'DOCTOR', roleName: 'Doctor' });
    const cashierRole = buildRole({ roleCode: 'CASHIER', roleName: 'Cashier' });
    roleRepository.seed(doctorRole);
    roleRepository.seed(cashierRole);
    const branchA = await branchRepository.create({ clinicId: 'clinic-1', branchCode: 'BR-A', branchName: 'Branch A', phone: '021', email: 'a@x.com', address: 'Jl. A' });
    const branchB = await branchRepository.create({ clinicId: 'clinic-1', branchCode: 'BR-B', branchName: 'Branch B', phone: '021', email: 'b@x.com', address: 'Jl. B' });

    await userRoleRepository.assignRoles('user-1', [doctorRole.id, cashierRole.id]);
    await userBranchRepository.replaceAssignments('user-1', [
      { branchId: branchA.id, isDefault: true },
      { branchId: branchB.id, isDefault: false },
    ], 'admin-1');

    const useCase = new GetRoleBranchMatrixUseCase(roleRepository, branchRepository, userRoleRepository, userBranchRepository);
    const matrix = await useCase.execute();

    expect(matrix).toHaveLength(4);
    expect(matrix).toEqual(
      expect.arrayContaining([
        { roleId: doctorRole.id, roleName: 'Doctor', branchId: branchA.id, branchName: 'Branch A', userCount: 1 },
        { roleId: doctorRole.id, roleName: 'Doctor', branchId: branchB.id, branchName: 'Branch B', userCount: 1 },
        { roleId: cashierRole.id, roleName: 'Cashier', branchId: branchA.id, branchName: 'Branch A', userCount: 1 },
        { roleId: cashierRole.id, roleName: 'Cashier', branchId: branchB.id, branchName: 'Branch B', userCount: 1 },
      ]),
    );
  });

  it('omits (role, branch) pairs with zero assigned users', async () => {
    const roleRepository = new FakeRoleRepository();
    const branchRepository = new FakeBranchRepository();
    const userRoleRepository = new FakeUserRoleRepository(roleRepository);
    const userBranchRepository = new FakeUserBranchRepository();
    const doctorRole = buildRole({ roleCode: 'DOCTOR', roleName: 'Doctor' });
    roleRepository.seed(doctorRole);
    await branchRepository.create({ clinicId: 'clinic-1', branchCode: 'BR-A', branchName: 'Branch A', phone: '021', email: 'a@x.com', address: 'Jl. A' });

    const useCase = new GetRoleBranchMatrixUseCase(roleRepository, branchRepository, userRoleRepository, userBranchRepository);
    const matrix = await useCase.execute();

    expect(matrix).toEqual([]);
  });
});
