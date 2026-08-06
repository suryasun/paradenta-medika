import { ToothConditionTemplateAdapter } from './ToothConditionTemplateAdapter';
import { FakeToothConditionRepository } from '../../../../../tests/fakes/masterDataFakes';
import { MasterDataReferenceInvalidException } from '../../domain/exceptions/MasterDataExceptions';

describe('ToothConditionTemplateAdapter (Phase 4 hardening)', () => {
  it('creates a branch-specific override without touching the global row', async () => {
    const toothConditionRepository = new FakeToothConditionRepository();
    const global = await toothConditionRepository.create({ conditionCode: 'CARIES', conditionName: 'Caries', category: 'DISEASE' });
    const adapter = new ToothConditionTemplateAdapter(toothConditionRepository);

    const result = await adapter.applyToEntity('branch-a', { conditionCode: 'CARIES', conditionName: 'Caries (Branch A)', colorCode: 'Red' });

    expect(result.created).toBe(true);
    const globalStillIntact = await toothConditionRepository.findById(global.id);
    expect(globalStillIntact?.conditionName).toBe('Caries');
    const override = await toothConditionRepository.findById(result.entityId);
    expect(override?.branchId).toBe('branch-a');
    expect(override?.category).toBe('DISEASE'); // inherited from the global row
  });

  it('rejects a template with no category and no existing global row to inherit one from', async () => {
    const toothConditionRepository = new FakeToothConditionRepository();
    const adapter = new ToothConditionTemplateAdapter(toothConditionRepository);

    await expect(adapter.applyToEntity('branch-a', { conditionCode: 'NEW_COND', conditionName: 'Brand New' })).rejects.toBeInstanceOf(
      MasterDataReferenceInvalidException,
    );
  });
});
