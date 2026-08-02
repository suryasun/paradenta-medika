import { GetPatientTimelineSummaryUseCase } from './GetPatientTimelineSummaryUseCase';
import {
  FakePrescriptionRepository,
  FakeTreatmentPlanRepository,
  FakeVisitRepository,
} from '../../../../../tests/fakes/emrFakes';
import { FakePatientRepository } from '../../../../../tests/fakes/patientFakes';
import { FakeMedicalHistoryRepository, FakeAllergyRepository } from '../../../../../tests/fakes/emrFakes';

function buildSut() {
  const patientRepository = new FakePatientRepository();
  const visitRepository = new FakeVisitRepository();
  const medicalHistoryRepository = new FakeMedicalHistoryRepository();
  const allergyRepository = new FakeAllergyRepository();
  const treatmentPlanRepository = new FakeTreatmentPlanRepository();
  const prescriptionRepository = new FakePrescriptionRepository();
  const useCase = new GetPatientTimelineSummaryUseCase(
    patientRepository,
    visitRepository,
    medicalHistoryRepository,
    allergyRepository,
    treatmentPlanRepository,
    prescriptionRepository,
  );
  return { patientRepository, visitRepository, medicalHistoryRepository, allergyRepository, treatmentPlanRepository, useCase };
}

describe('GetPatientTimelineSummaryUseCase (task-092)', () => {
  it('surfaces active Clinical Alerts (allergy/medical history)', async () => {
    const { patientRepository, medicalHistoryRepository, allergyRepository, useCase } = buildSut();
    const patient = await patientRepository.create('MRN000031', {
      patientName: 'Summary Test Patient',
      gender: 'FEMALE',
      birthDate: new Date('1990-01-01'),
      phone: '08120003100',
      address: 'Jl. Summary No. 1',
    });
    await medicalHistoryRepository.create({ patientId: patient.id, category: 'DIABETES', description: 'Type 2', createdBy: 'doc-1' });
    await allergyRepository.create({ patientId: patient.id, type: 'DRUG', allergen: 'Penicillin', severity: 'SEVERE', createdBy: 'doc-1' });

    const summary = await useCase.execute(patient.id);

    expect(summary.activeAlerts.medicalHistory).toHaveLength(1);
    expect(summary.activeAlerts.allergies).toHaveLength(1);
    expect(summary.activeAlerts.allergies[0].allergen).toBe('Penicillin');
  });

  it('excludes treatment plan items already converted to a Reservation from openTreatmentPlanItems', async () => {
    const { patientRepository, treatmentPlanRepository, useCase } = buildSut();
    const patient = await patientRepository.create('MRN000032', {
      patientName: 'Open Items Patient',
      gender: 'MALE',
      birthDate: new Date('1990-01-01'),
      phone: '08120003200',
      address: 'Jl. Open No. 1',
    });
    const [openItem, convertedItem] = await treatmentPlanRepository.createMany([
      { visitId: 'v1', patientId: patient.id, treatmentId: 't1', estimatedCost: 100000, createdBy: 'doc-1' },
      { visitId: 'v1', patientId: patient.id, treatmentId: 't2', estimatedCost: 200000, createdBy: 'doc-1' },
    ]);
    treatmentPlanRepository.convertedItemIds.add(convertedItem.id);

    const summary = await useCase.execute(patient.id);

    expect(summary.openTreatmentPlanItems.map((i) => i.id)).toEqual([openItem.id]);
  });

  it('returns null highlights when nothing is on record yet', async () => {
    const { patientRepository, useCase } = buildSut();
    const patient = await patientRepository.create('MRN000033', {
      patientName: 'Empty Patient',
      gender: 'MALE',
      birthDate: new Date('1990-01-01'),
      phone: '08120003300',
      address: 'Jl. Empty No. 1',
    });

    const summary = await useCase.execute(patient.id);

    expect(summary.mostRecentVisit).toBeNull();
    expect(summary.lastPrescription).toBeNull();
  });
});
