import { TreatmentTemplateAdapter } from './TreatmentTemplateAdapter';
import { FakeTreatmentRepository } from '../../../../../tests/fakes/emrFakes';
import { MasterDataReferenceInvalidException } from '../../domain/exceptions/MasterDataExceptions';

describe('TreatmentTemplateAdapter (Phase 4 hardening)', () => {
  it('creates a branch-specific override without touching the global row', async () => {
    const treatmentRepository = new FakeTreatmentRepository();
    const global = await treatmentRepository.create({ treatmentCode: 'TRT-X', treatmentName: 'Scaling', treatmentCategoryId: 'cat-1', defaultPrice: 100000 });
    const adapter = new TreatmentTemplateAdapter(treatmentRepository);

    const result = await adapter.applyToEntity('branch-a', { treatmentCode: 'TRT-X', treatmentName: 'Scaling (Branch A)', defaultPrice: 120000 });

    expect(result.created).toBe(true);
    const globalStillIntact = await treatmentRepository.findById(global.id);
    expect(globalStillIntact?.treatmentName).toBe('Scaling');
    const override = await treatmentRepository.findById(result.entityId);
    expect(override?.branchId).toBe('branch-a');
    expect(override?.treatmentName).toBe('Scaling (Branch A)');
    expect(override?.treatmentCategoryId).toBe('cat-1'); // inherited from the global row
  });

  it('applying again updates the same branch-specific row instead of creating a second one', async () => {
    const treatmentRepository = new FakeTreatmentRepository();
    await treatmentRepository.create({ treatmentCode: 'TRT-X', treatmentName: 'Scaling', treatmentCategoryId: 'cat-1', defaultPrice: 100000 });
    const adapter = new TreatmentTemplateAdapter(treatmentRepository);
    const first = await adapter.applyToEntity('branch-a', { treatmentCode: 'TRT-X', treatmentName: 'V1', defaultPrice: 110000 });

    const second = await adapter.applyToEntity('branch-a', { treatmentCode: 'TRT-X', treatmentName: 'V2', defaultPrice: 130000 });

    expect(second.created).toBe(false);
    expect(second.entityId).toBe(first.entityId);
    const rows = [...treatmentRepository.treatments.values()].filter((t) => t.treatmentCode === 'TRT-X' && t.branchId === 'branch-a');
    expect(rows).toHaveLength(1);
    expect(rows[0].treatmentName).toBe('V2');
  });

  it('rejects a template with no treatmentCategoryId and no existing global row to inherit one from', async () => {
    const treatmentRepository = new FakeTreatmentRepository();
    const adapter = new TreatmentTemplateAdapter(treatmentRepository);

    await expect(adapter.applyToEntity('branch-a', { treatmentCode: 'TRT-NEW', treatmentName: 'Brand New', defaultPrice: 100000 })).rejects.toBeInstanceOf(
      MasterDataReferenceInvalidException,
    );
  });

  it('readEntitySnapshot returns the applied row\'s live field values', async () => {
    const treatmentRepository = new FakeTreatmentRepository();
    await treatmentRepository.create({ treatmentCode: 'TRT-X', treatmentName: 'Scaling', treatmentCategoryId: 'cat-1', defaultPrice: 100000 });
    const adapter = new TreatmentTemplateAdapter(treatmentRepository);
    const { entityId } = await adapter.applyToEntity('branch-a', { treatmentCode: 'TRT-X', treatmentName: 'Scaling (Branch A)', defaultPrice: 120000 });

    const snapshot = await adapter.readEntitySnapshot('branch-a', entityId);

    expect(snapshot).toMatchObject({ treatmentCode: 'TRT-X', treatmentName: 'Scaling (Branch A)', defaultPrice: 120000 });
  });
});
