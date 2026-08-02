import { CreatePrescriptionUseCase } from './CreatePrescriptionUseCase';
import { AllergyCheckService } from '../services/AllergyCheckService';
import { FakeAllergyRepository, FakePrescriptionRepository, FakeVisitRepository } from '../../../../../tests/fakes/emrFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { PrescriptionAllergyConflictException } from '../../domain/exceptions/EmrExceptions';

async function seedVisit(repo: FakeVisitRepository) {
  return repo.create({ visitNo: 'VIS000001', patientId: 'p1', doctorId: 'd1', branchId: 'b1', queueId: 'q1', createdBy: 'doc-1' });
}

describe('CreatePrescriptionUseCase (task-065)', () => {
  it('blocks prescribing a medicine matching a recorded Drug Allergy', async () => {
    const visitRepository = new FakeVisitRepository();
    const prescriptionRepository = new FakePrescriptionRepository();
    const allergyRepository = new FakeAllergyRepository();
    const auditService = new FakeAuditService();
    const visit = await seedVisit(visitRepository);
    await allergyRepository.create({ patientId: 'p1', type: 'DRUG', allergen: 'Amoxicillin', severity: 'SEVERE', createdBy: 'doc-1' });
    const allergyCheckService = new AllergyCheckService(allergyRepository);
    const useCase = new CreatePrescriptionUseCase(visitRepository, prescriptionRepository, allergyCheckService, auditService);

    await expect(
      useCase.execute({
        visitId: visit.id,
        items: [{ medicineName: 'Amoxicillin 500mg', dosage: '500mg', frequency: '3x daily', duration: '5 days' }],
        actorUserId: 'doc-1',
      }),
    ).rejects.toBeInstanceOf(PrescriptionAllergyConflictException);

    expect(prescriptionRepository.prescriptions.size).toBe(0);
  });

  it('persists all line details when there is no allergy conflict', async () => {
    const visitRepository = new FakeVisitRepository();
    const prescriptionRepository = new FakePrescriptionRepository();
    const allergyRepository = new FakeAllergyRepository();
    const auditService = new FakeAuditService();
    const visit = await seedVisit(visitRepository);
    const allergyCheckService = new AllergyCheckService(allergyRepository);
    const useCase = new CreatePrescriptionUseCase(visitRepository, prescriptionRepository, allergyCheckService, auditService);

    const prescription = await useCase.execute({
      visitId: visit.id,
      items: [
        { medicineName: 'Paracetamol', dosage: '500mg', frequency: '3x daily', duration: '3 days', instruction: 'After meals' },
        { medicineName: 'Amoxicillin', dosage: '500mg', frequency: '3x daily', duration: '5 days' },
      ],
      actorUserId: 'doc-1',
    });

    expect(prescription.items).toHaveLength(2);
    expect(prescription.items[0]).toMatchObject({
      medicineName: 'Paracetamol',
      dosage: '500mg',
      frequency: '3x daily',
      duration: '3 days',
      instruction: 'After meals',
    });
    expect(prescription.patientId).toBe('p1');
    expect(auditService.records).toHaveLength(1);
  });
});
