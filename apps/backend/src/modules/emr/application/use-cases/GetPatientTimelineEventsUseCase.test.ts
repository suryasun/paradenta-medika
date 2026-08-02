import { GetPatientTimelineUseCase } from './GetPatientTimelineUseCase';
import { GetPatientTimelineEventsUseCase } from './GetPatientTimelineEventsUseCase';
import {
  FakeAttachmentRepository,
  FakeConsentRepository,
  FakeFollowUpRepository,
  FakeOdontogramRepository,
  FakePrescriptionRepository,
  FakeReferralRepository,
  FakeSoapNoteRepository,
  FakeVisitDiagnosisRepository,
  FakeVisitRepository,
  FakeVisitTreatmentRepository,
} from '../../../../../tests/fakes/emrFakes';
import { FakePatientRepository } from '../../../../../tests/fakes/patientFakes';

function buildSut() {
  const patientRepository = new FakePatientRepository();
  const visitRepository = new FakeVisitRepository();
  const visitDiagnosisRepository = new FakeVisitDiagnosisRepository();
  const referralRepository = new FakeReferralRepository();
  const getPatientTimelineUseCase = new GetPatientTimelineUseCase(
    patientRepository,
    visitRepository,
    new FakeSoapNoteRepository(),
    visitDiagnosisRepository,
    new FakeVisitTreatmentRepository(),
    new FakePrescriptionRepository(),
    new FakeOdontogramRepository(),
    new FakeAttachmentRepository(),
    new FakeConsentRepository(),
    referralRepository,
    new FakeFollowUpRepository(),
  );
  const useCase = new GetPatientTimelineEventsUseCase(getPatientTimelineUseCase);
  return { patientRepository, visitRepository, visitDiagnosisRepository, referralRepository, useCase };
}

describe('GetPatientTimelineEventsUseCase (task-093)', () => {
  it('filtering by event type returns only matching events', async () => {
    const { patientRepository, visitRepository, visitDiagnosisRepository, referralRepository, useCase } = buildSut();
    const patient = await patientRepository.create('MRN000034', {
      patientName: 'Filter Test Patient',
      gender: 'MALE',
      birthDate: new Date('1990-01-01'),
      phone: '08120003400',
      address: 'Jl. Filter No. 1',
    });
    const visit = await visitRepository.create({
      visitNo: 'VIS000034',
      patientId: patient.id,
      doctorId: 'doc-1',
      branchId: 'b1',
      queueId: 'q34',
      createdBy: 'doc-1',
    });
    await visitDiagnosisRepository.createMany([
      { visitId: visit.id, diagnosisType: 'PRIMARY', diagnosisName: 'Caries', createdBy: 'doc-1' },
    ]);
    await referralRepository.create({ visitId: visit.id, patientId: patient.id, targetType: 'SPECIALIST', reason: 'Root canal', createdBy: 'doc-1' });

    const unfiltered = await useCase.execute(patient.id);
    expect(unfiltered.length).toBeGreaterThanOrEqual(3); // VISIT + DIAGNOSIS + REFERRAL

    const filtered = await useCase.execute(patient.id, 'DIAGNOSIS');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].eventType).toBe('DIAGNOSIS');
  });
});
