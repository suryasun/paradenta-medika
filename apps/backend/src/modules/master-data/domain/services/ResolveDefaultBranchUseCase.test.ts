import { ResolveDefaultBranchUseCase, DEFAULT_BRANCH_PARAMETER_KEY } from './ResolveDefaultBranchUseCase';
import { FakeUserBranchRepository } from '../../../../../tests/fakes/systemFakes';
import { FakeSystemParameterRepository } from '../../../../../tests/fakes/systemFakes';
import { NoDefaultBranchConfiguredException } from '../exceptions/MasterDataExceptions';

describe('task-212: ResolveDefaultBranchUseCase', () => {
  it("uses the user's own default branch assignment when present", async () => {
    const userBranchRepository = new FakeUserBranchRepository();
    const systemParameterRepository = new FakeSystemParameterRepository();
    await userBranchRepository.replaceAssignments('user-1', [{ branchId: 'branch-a', isDefault: false }, { branchId: 'branch-b', isDefault: true }], 'admin-1');
    const useCase = new ResolveDefaultBranchUseCase(userBranchRepository, systemParameterRepository);

    await expect(useCase.execute('user-1')).resolves.toBe('branch-b');
  });

  it('falls back to the clinic-level GLOBAL default when the user has no default assignment', async () => {
    const userBranchRepository = new FakeUserBranchRepository();
    const systemParameterRepository = new FakeSystemParameterRepository();
    await systemParameterRepository.create({
      key: DEFAULT_BRANCH_PARAMETER_KEY,
      scopeType: 'GLOBAL',
      valueType: 'STRING',
      value: 'branch-clinic-default',
      createdBy: 'admin-1',
    });
    const useCase = new ResolveDefaultBranchUseCase(userBranchRepository, systemParameterRepository);

    await expect(useCase.execute('user-1')).resolves.toBe('branch-clinic-default');
  });

  it('throws an explicit error rather than silently guessing when neither exists', async () => {
    const userBranchRepository = new FakeUserBranchRepository();
    const systemParameterRepository = new FakeSystemParameterRepository();
    const useCase = new ResolveDefaultBranchUseCase(userBranchRepository, systemParameterRepository);

    await expect(useCase.execute('user-1')).rejects.toThrow(NoDefaultBranchConfiguredException);
  });
});
