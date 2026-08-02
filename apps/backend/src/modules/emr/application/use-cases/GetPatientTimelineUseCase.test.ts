import { GetPatientTimelineUseCase } from './GetPatientTimelineUseCase';
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
import { PatientNotFoundException } from '../../../patient/domain/exceptions/PatientExceptions';

function buildSut() {
  const patientRepository = new FakePatientRepository();
  const visitRepository = new FakeVisitRepository();
  const soapNoteRepository = new FakeSoapNoteRepository();
  const visitDiagnosisRepository = new FakeVisitDiagnosisRepository();
  const visitTreatmentRepository = new FakeVisitTreatmentRepository();
  const prescriptionRepository = new FakePrescriptionRepository();
  const odontogramRepository = new FakeOdontogramRepository();
  const attachmentRepository = new FakeAttachmentRepository();
  const consentRepository = new FakeConsentRepository();
  const referralRepository = new FakeReferralRepository();
  const followUpRepository = new FakeFollowUpRepository();
  const useCase = new GetPatientTimelineUseCase(
    patientRepository,
    visitRepository,
    soapNoteRepository,
    visitDiagnosisRepository,
    visitTreatmentRepository,
    prescriptionRepository,
    odontogramRepository,
    attachmentRepository,
    consentRepository,
    referralRepository,
    followUpRepository,
  );
  return {
    patientRepository,
    visitRepository,
    soapNoteRepository,
    visitDiagnosisRepository,
    visitTreatmentRepository,
    prescriptionRepository,
    odontogramRepository,
    referralRepository,
    followUpRepository,
    useCase,
  };
}

describe('GetPatientTimelineUseCase (task-091)', () => {
  it('rejects a non-existent patient', async () => {
    const { useCase } = buildSut();
    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(PatientNotFoundException);
  });

  it('interleaves events from multiple source tables in chronological order', async () => {
    const {
      patientRepository,
      visitRepository,
      visitDiagnosisRepository,
      referralRepository,
      followUpRepository,
      useCase,
    } = buildSut();

    const patient = await patientRepository.create('MRN000030', {
      patientName: 'Timeline Test Patient',
      gender: 'MALE',
      birthDate: new Date('1990-01-01'),
      phone: '08120003000',
      address: 'Jl. Timeline No. 1',
    });
    const visit = await visitRepository.create({
      visitNo: 'VIS000030',
      patientId: patient.id,
      doctorId: 'doc-1',
      branchId: 'b1',
      queueId: 'q30',
      createdBy: 'doc-1',
    });

    // Insert out of chronological order to prove the use case sorts, not just appends.
    await followUpRepository.create({ visitId: visit.id, patientId: patient.id, followUpDate: new Date(), createdBy: 'doc-1' });
    await visitDiagnosisRepository.createMany([
      { visitId: visit.id, diagnosisType: 'PRIMARY', diagnosisName: 'Caries', createdBy: 'doc-1' },
    ]);
    await referralRepository.create({ visitId: visit.id, patientId: patient.id, targetType: 'SPECIALIST', reason: 'Root canal', createdBy: 'doc-1' });

    const events = await useCase.execute(patient.id);

    expect(events.length).toBeGreaterThanOrEqual(4); // VISIT + FOLLOW_UP + DIAGNOSIS + REFERRAL
    expect(events[0].eventType).toBe('VISIT');
    for (let i = 1; i < events.length; i += 1) {
      expect(new Date(events[i].occurredAt).getTime()).toBeGreaterThanOrEqual(new Date(events[i - 1].occurredAt).getTime());
    }
    const eventTypes = events.map((e) => e.eventType);
    expect(eventTypes).toEqual(expect.arrayContaining(['VISIT', 'FOLLOW_UP', 'DIAGNOSIS', 'REFERRAL']));
  });
});
