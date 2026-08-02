import { AddPeriodontalMeasurementUseCase } from './AddPeriodontalMeasurementUseCase';
import { FakePeriodontalAssessmentRepository, FakePeriodontalMeasurementRepository } from '../../../../../tests/fakes/emrFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { FurcationNotApplicableException, InvalidToothNumberException, PeriodontalAssessmentLockedException } from '../../domain/exceptions/EmrExceptions';
import { PeriodontalMeasurementPointDto } from '../dtos/SaveMeasurementRequestDto';

async function seedAssessment(repo: FakePeriodontalAssessmentRepository) {
  return repo.create({ visitId: 'v1', patientId: 'p1', doctorId: 'd1', createdBy: 'doc-1' });
}

describe('AddPeriodontalMeasurementUseCase (task-072)', () => {
  it('rejects adding a measurement to a Locked assessment', async () => {
    const assessmentRepository = new FakePeriodontalAssessmentRepository();
    const measurementRepository = new FakePeriodontalMeasurementRepository();
    const auditService = new FakeAuditService();
    const assessment = await seedAssessment(assessmentRepository);
    await assessmentRepository.lock(assessment.id, 'doc-1');
    const useCase = new AddPeriodontalMeasurementUseCase(assessmentRepository, measurementRepository, auditService);

    await expect(
      useCase.execute({
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

  it('rejects an invalid FDI tooth number', async () => {
    const assessmentRepository = new FakePeriodontalAssessmentRepository();
    const measurementRepository = new FakePeriodontalMeasurementRepository();
    const auditService = new FakeAuditService();
    const assessment = await seedAssessment(assessmentRepository);
    const useCase = new AddPeriodontalMeasurementUseCase(assessmentRepository, measurementRepository, auditService);

    await expect(
      useCase.execute({
        assessmentId: assessment.id,
        toothNumber: 99,
        measurementPoint: PeriodontalMeasurementPointDto.MB,
        pocketDepth: 3,
        gingivalMargin: 0,
        bleeding: false,
        actorUserId: 'doc-1',
      }),
    ).rejects.toBeInstanceOf(InvalidToothNumberException);
  });

  it('rejects a furcation grade on a single-rooted tooth (Part 3.2B Section 18)', async () => {
    const assessmentRepository = new FakePeriodontalAssessmentRepository();
    const measurementRepository = new FakePeriodontalMeasurementRepository();
    const auditService = new FakeAuditService();
    const assessment = await seedAssessment(assessmentRepository);
    const useCase = new AddPeriodontalMeasurementUseCase(assessmentRepository, measurementRepository, auditService);

    await expect(
      useCase.execute({
        assessmentId: assessment.id,
        toothNumber: 11,
        measurementPoint: PeriodontalMeasurementPointDto.B,
        pocketDepth: 3,
        gingivalMargin: 0,
        bleeding: false,
        furcation: 'I',
        actorUserId: 'doc-1',
      }),
    ).rejects.toBeInstanceOf(FurcationNotApplicableException);
  });

  it('persists the measurement with an auto-computed CAL (pocketDepth + gingivalMargin)', async () => {
    const assessmentRepository = new FakePeriodontalAssessmentRepository();
    const measurementRepository = new FakePeriodontalMeasurementRepository();
    const auditService = new FakeAuditService();
    const assessment = await seedAssessment(assessmentRepository);
    const useCase = new AddPeriodontalMeasurementUseCase(assessmentRepository, measurementRepository, auditService);

    const measurement = await useCase.execute({
      assessmentId: assessment.id,
      toothNumber: 16,
      measurementPoint: PeriodontalMeasurementPointDto.MB,
      pocketDepth: 4,
      gingivalMargin: -1,
      bleeding: true,
      plaqueIndex: 2,
      mobility: 1,
      furcation: 'I',
      actorUserId: 'doc-1',
    });

    expect(measurement.cal).toBe(3);
    expect(measurement.bleeding).toBe(true);
    expect(auditService.records).toHaveLength(1);
  });
});
