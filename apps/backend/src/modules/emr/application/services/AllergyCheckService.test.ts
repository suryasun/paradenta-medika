import { AllergyCheckService } from './AllergyCheckService';
import { FakeAllergyRepository } from '../../../../../tests/fakes/emrFakes';

describe('AllergyCheckService (task-062: reusable interface for task-065 Prescription)', () => {
  it('flags a matching Drug allergy for a medicine name', async () => {
    const allergyRepository = new FakeAllergyRepository();
    await allergyRepository.create({ patientId: 'p1', type: 'DRUG', allergen: 'Amoxicillin', severity: 'SEVERE', createdBy: 'doc-1' });
    const service = new AllergyCheckService(allergyRepository);

    const match = await service.findMatchingDrugAllergy('p1', 'Amoxicillin 500mg');
    expect(match).not.toBeNull();
    expect(match?.allergen).toBe('Amoxicillin');
    expect(match?.severity).toBe('SEVERE');
  });

  it('does not flag an unrelated medicine', async () => {
    const allergyRepository = new FakeAllergyRepository();
    await allergyRepository.create({ patientId: 'p1', type: 'DRUG', allergen: 'Penicillin', severity: 'MODERATE', createdBy: 'doc-1' });
    const service = new AllergyCheckService(allergyRepository);

    const match = await service.findMatchingDrugAllergy('p1', 'Paracetamol');
    expect(match).toBeNull();
  });

  it('ignores non-Drug allergy types when checking a prescription', async () => {
    const allergyRepository = new FakeAllergyRepository();
    await allergyRepository.create({ patientId: 'p1', type: 'FOOD', allergen: 'Penicillin', severity: 'SEVERE', createdBy: 'doc-1' });
    const service = new AllergyCheckService(allergyRepository);

    const match = await service.findMatchingDrugAllergy('p1', 'Penicillin');
    expect(match).toBeNull();
  });
});
