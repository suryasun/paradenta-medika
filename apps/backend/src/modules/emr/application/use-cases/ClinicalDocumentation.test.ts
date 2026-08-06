import { RecordVitalSignUseCase } from './RecordVitalSignUseCase';
import { RecordSoapNoteUseCase } from './RecordSoapNoteUseCase';
import { RecordDiagnosisUseCase } from './RecordDiagnosisUseCase';
import {
  FakeSoapNoteRepository,
  FakeVisitDiagnosisRepository,
  FakeVisitRepository,
  FakeVitalSignRepository,
} from '../../../../../tests/fakes/emrFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { VisitNotOpenException } from '../../domain/exceptions/EmrExceptions';
import { ValidationException } from '../../../../shared/http/exceptions';

async function seedVisit(repo: FakeVisitRepository, status: string = 'DRAFT') {
  const visit = await repo.create({
    visitNo: 'VIS000001',
    patientId: 'p1',
    doctorId: 'd1',
    branchId: 'b1',
    queueId: 'q1',
    createdBy: 'doc-1',
  });
  repo.visits.get(visit.id)!.status = status as never;
  return visit;
}

describe('RecordVitalSignUseCase (task-049)', () => {
  // docs/06-tasks/task-316.md: COMPLETED no longer blocks documentation --
  // only LOCKED/ARCHIVED do.
  it('can only be recorded against an open Visit', async () => {
    const visitRepository = new FakeVisitRepository();
    const vitalSignRepository = new FakeVitalSignRepository();
    const auditService = new FakeAuditService();
    const visit = await seedVisit(visitRepository, 'LOCKED');
    const useCase = new RecordVitalSignUseCase(visitRepository, vitalSignRepository, auditService);

    await expect(useCase.execute({ visitId: visit.id, heartRate: 80, actorUserId: 'nurse-1' })).rejects.toBeInstanceOf(
      VisitNotOpenException,
    );
  });

  it('docs/06-tasks/task-316.md: can still be recorded against a COMPLETED Visit', async () => {
    const visitRepository = new FakeVisitRepository();
    const vitalSignRepository = new FakeVitalSignRepository();
    const auditService = new FakeAuditService();
    const visit = await seedVisit(visitRepository, 'COMPLETED');
    const useCase = new RecordVitalSignUseCase(visitRepository, vitalSignRepository, auditService);

    const result = await useCase.execute({ visitId: visit.id, heartRate: 80, actorUserId: 'nurse-1' });
    expect(result.heartRate).toBe(80);
  });

  it('persists and is retrievable against the correct Visit', async () => {
    const visitRepository = new FakeVisitRepository();
    const vitalSignRepository = new FakeVitalSignRepository();
    const auditService = new FakeAuditService();
    const visit = await seedVisit(visitRepository);
    const useCase = new RecordVitalSignUseCase(visitRepository, vitalSignRepository, auditService);

    const result = await useCase.execute({ visitId: visit.id, heartRate: 80, temperature: 36.5, actorUserId: 'nurse-1' });

    expect(result.heartRate).toBe(80);
    const stored = await vitalSignRepository.findByVisitId(visit.id);
    expect(stored).toHaveLength(1);
  });
});

describe('RecordSoapNoteUseCase (task-050)', () => {
  it('can only be recorded against an open Visit', async () => {
    const visitRepository = new FakeVisitRepository();
    const soapNoteRepository = new FakeSoapNoteRepository();
    const auditService = new FakeAuditService();
    const visit = await seedVisit(visitRepository, 'LOCKED');
    const useCase = new RecordSoapNoteUseCase(visitRepository, soapNoteRepository, auditService);

    await expect(useCase.execute({ visitId: visit.id, subjective: 'x', actorUserId: 'doc-1' })).rejects.toBeInstanceOf(
      VisitNotOpenException,
    );
  });

  it('all four sections persist and are retrievable', async () => {
    const visitRepository = new FakeVisitRepository();
    const soapNoteRepository = new FakeSoapNoteRepository();
    const auditService = new FakeAuditService();
    const visit = await seedVisit(visitRepository);
    const useCase = new RecordSoapNoteUseCase(visitRepository, soapNoteRepository, auditService);

    const result = await useCase.execute({
      visitId: visit.id,
      subjective: 'Sakit gigi',
      objective: 'Karies',
      assessment: 'Karies dentin',
      plan: 'Tambal',
      actorUserId: 'doc-1',
    });

    expect(result).toEqual({ subjective: 'Sakit gigi', objective: 'Karies', assessment: 'Karies dentin', plan: 'Tambal' });
  });
});

describe('RecordDiagnosisUseCase (task-051)', () => {
  // docs/06-tasks/task-316.md: COMPLETED no longer blocks documentation --
  // only LOCKED/ARCHIVED do.
  it('can only be recorded against an open Visit', async () => {
    const visitRepository = new FakeVisitRepository();
    const diagnosisRepository = new FakeVisitDiagnosisRepository();
    const auditService = new FakeAuditService();
    const visit = await seedVisit(visitRepository, 'LOCKED');
    const useCase = new RecordDiagnosisUseCase(visitRepository, diagnosisRepository, auditService);

    await expect(
      useCase.execute({ visitId: visit.id, diagnoses: [{ diagnosisType: 'PRIMARY', diagnosisName: 'Karies' }], actorUserId: 'doc-1' }),
    ).rejects.toBeInstanceOf(VisitNotOpenException);
  });

  it('requires at least one Primary Diagnosis', async () => {
    const visitRepository = new FakeVisitRepository();
    const diagnosisRepository = new FakeVisitDiagnosisRepository();
    const auditService = new FakeAuditService();
    const visit = await seedVisit(visitRepository);
    const useCase = new RecordDiagnosisUseCase(visitRepository, diagnosisRepository, auditService);

    await expect(
      useCase.execute({ visitId: visit.id, diagnoses: [{ diagnosisType: 'SECONDARY', diagnosisName: 'x' }], actorUserId: 'doc-1' }),
    ).rejects.toBeInstanceOf(ValidationException);
  });

  it('persists diagnosis entries retrievable against the correct Visit', async () => {
    const visitRepository = new FakeVisitRepository();
    const diagnosisRepository = new FakeVisitDiagnosisRepository();
    const auditService = new FakeAuditService();
    const visit = await seedVisit(visitRepository);
    const useCase = new RecordDiagnosisUseCase(visitRepository, diagnosisRepository, auditService);

    const result = await useCase.execute({
      visitId: visit.id,
      diagnoses: [{ diagnosisType: 'PRIMARY', diagnosisName: 'Karies dentin' }],
      actorUserId: 'doc-1',
    });

    expect(result).toHaveLength(1);
    expect(result[0].diagnosisName).toBe('Karies dentin');
  });
});
