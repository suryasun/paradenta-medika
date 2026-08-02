import { AddPeriodontalMeasurementUseCase } from './AddPeriodontalMeasurementUseCase';
import { LockPeriodontalAssessmentUseCase } from './LockPeriodontalAssessmentUseCase';
import { FakePeriodontalAssessmentRepository, FakePeriodontalMeasurementRepository } from '../../../../../tests/fakes/emrFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { PeriodontalAssessmentLockedException } from '../../domain/exceptions/EmrExceptions';
import { PeriodontalMeasurementPointDto } from '../dtos/SaveMeasurementRequestDto';

describe('LockPeriodontalAssessmentUseCase (task-077)', () => {
  it('transitions the assessment to Locked', async () => {
    const assessmentRepository = new FakePeriodontalAssessmentRepository();
    const auditService = new FakeAuditService();
    const assessment = await assessmentRepository.create({ visitId: 'v1', patientId: 'p1', doctorId: 'd1', createdBy: 'doc-1' });
    const useCase = new LockPeriodontalAssessmentUseCase(assessmentRepository, auditService);

    const locked = await useCase.execute({ assessmentId: assessment.id, actorUserId: 'doc-1' });

    expect(locked.status).toBe('LOCKED');
    expect(locked.lockedBy).toBe('doc-1');
    expect(auditService.records).toHaveLength(1);
  });

  it('rejects locking an already-Locked assessment', async () => {
    const assessmentRepository = new FakePeriodontalAssessmentRepository();
    const auditService = new FakeAuditService();
    const assessment = await assessmentRepository.create({ visitId: 'v1', patientId: 'p1', doctorId: 'd1', createdBy: 'doc-1' });
    await assessmentRepository.lock(assessment.id, 'doc-1');
    const useCase = new LockPeriodontalAssessmentUseCase(assessmentRepository, auditService);

    await expect(useCase.execute({ assessmentId: assessment.id, actorUserId: 'doc-1' })).rejects.toBeInstanceOf(
      PeriodontalAssessmentLockedException,
    );
  });

  it('becomes immutable: measurement writes are rejected after locking', async () => {
    const assessmentRepository = new FakePeriodontalAssessmentRepository();
    const measurementRepository = new FakePeriodontalMeasurementRepository();
    const auditService = new FakeAuditService();
    const assessment = await assessmentRepository.create({ visitId: 'v1', patientId: 'p1', doctorId: 'd1', createdBy: 'doc-1' });
    const lockUseCase = new LockPeriodontalAssessmentUseCase(assessmentRepository, auditService);
    await lockUseCase.execute({ assessmentId: assessment.id, actorUserId: 'doc-1' });

    const addUseCase = new AddPeriodontalMeasurementUseCase(assessmentRepository, measurementRepository, auditService);
    await expect(
      addUseCase.execute({
        assessmentId: assessment.id,
        toothNumber: 16,
        measurementPoint: PeriodontalMeasurementPointDto.MB,
        pocketDepth: 3,
        gingivalMargin: 0,
        bleeding: false,
        actorUserId: 'doc-1',
      }),
    ).rejects.toBeInstanceOf(PeriodontalAssessmentLockedException);
  });
});
