import { GetBranchConfigurationUseCase } from './GetBranchConfigurationUseCase';
import { FakeSystemParameterRepository } from '../../../../../tests/fakes/systemFakes';
import { FakeBranchRepository } from '../../../../../tests/fakes/masterDataFakes';
import { MasterDataNotFoundException } from '../../../master-data/domain/exceptions/MasterDataExceptions';

describe('task-213: GetBranchConfigurationUseCase', () => {
  it('distinguishes branch-level overrides from inherited GLOBAL defaults', async () => {
    const branchRepository = new FakeBranchRepository();
    const systemParameterRepository = new FakeSystemParameterRepository();
    const branch = await branchRepository.create({ clinicId: 'clinic-1', branchCode: 'BR-A', branchName: 'Branch A', phone: '021', email: 'a@x.com', address: 'Jl. A' });
    await systemParameterRepository.create({ key: 'masterdata.branch.default', scopeType: 'GLOBAL', valueType: 'STRING', value: 'branch-global', createdBy: 'admin-1' });
    await systemParameterRepository.create({ key: 'reservation.slot.duration', scopeType: 'GLOBAL', valueType: 'INTEGER', value: '30', createdBy: 'admin-1' });
    await systemParameterRepository.create({ key: 'reservation.slot.duration', scopeType: 'BRANCH', scopeId: branch.id, valueType: 'INTEGER', value: '45', createdBy: 'admin-1' });
    const useCase = new GetBranchConfigurationUseCase(branchRepository, systemParameterRepository);

    const entries = await useCase.execute(branch.id);

    expect(entries).toEqual(
      expect.arrayContaining([
        { key: 'reservation.slot.duration', value: '45', valueType: 'INTEGER', source: 'BRANCH' },
        { key: 'masterdata.branch.default', value: 'branch-global', valueType: 'STRING', source: 'GLOBAL' },
      ]),
    );
    expect(entries).toHaveLength(2);
  });

  it('throws when the branch does not exist', async () => {
    const branchRepository = new FakeBranchRepository();
    const systemParameterRepository = new FakeSystemParameterRepository();
    const useCase = new GetBranchConfigurationUseCase(branchRepository, systemParameterRepository);

    await expect(useCase.execute('missing-branch')).rejects.toThrow(MasterDataNotFoundException);
  });
});
