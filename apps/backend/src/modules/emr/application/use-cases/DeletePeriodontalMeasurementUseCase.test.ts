import { AddPeriodontalMeasurementUseCase } from './AddPeriodontalMeasurementUseCase';
import { DeletePeriodontalMeasurementUseCase } from './DeletePeriodontalMeasurementUseCase';
import { FakePeriodontalAssessmentRepository, FakePeriodontalMeasurementRepository } from '../../../../../tests/fakes/emrFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { PeriodontalAssessmentLockedException } from '../../domain/exceptions/EmrExceptions';
import { PeriodontalMeasurementPointDto } from '../dtos/SaveMeasurementRequestDto';

async function seedAssessmentWithMeasurement(
  assessmentRepository: FakePeriodontalAssessmentRepository,
  measurementRepository: FakePeriodontalMeasurementRepository,
  auditService: FakeAuditService,
) {
  const assessment = await assessmentRepository.create({ visitId: 'v1', patientId: 'p1', doctorId: 'd1', createdBy: 'doc-1' });
  const addUseCase = new AddPeriodontalMeasurementUseCase(assessmentRepository, measurementRepository, auditService);
  const measurement = await addUseCase.execute({
    assessmentId: assessment.id,
    toothNumber: 16,
    measurementPoint: PeriodontalMeasurementPointDto.MB,
    pocketDepth: 3,
    gingivalMargin: 0,
    bleeding: false,
    actorUserId: 'doc-1',
  });
  return { assessment, measurement };
}

describe('DeletePeriodontalMeasurementUseCase (task-074)', () => {
  it('succeeds on an unlocked assessment and soft-deletes the row', async () => {
    const assessmentRepository = new FakePeriodontalAssessmentRepository();
    const measurementRepository = new FakePeriodontalMeasurementRepository();
    const auditService = new FakeAuditService();
    const { assessment, measurement } = await seedAssessmentWithMeasurement(assessmentRepository, measurementRepository, auditService);
    const useCase = new DeletePeriodontalMeasurementUseCase(assessmentRepository, measurementRepository, auditService);

    await useCase.execute({ assessmentId: assessment.id, measurementId: measurement.id, actorUserId: 'doc-1' });

    expect(await measurementRepository.findById(measurement.id)).toBeNull();
    expect(measurementRepository.measurements.get(measurement.id)!.deletedAt).not.toBeNull();
  });

  it('is rejected once the parent assessment is Locked', async () => {
    const assessmentRepository = new FakePeriodontalAssessmentRepository();
    const measurementRepository = new FakePeriodontalMeasurementRepository();
    const auditService = new FakeAuditService();
    const { assessment, measurement } = await seedAssessmentWithMeasurement(assessmentRepository, measurementRepository, auditService);
    await assessmentRepository.lock(assessment.id, 'doc-1');
    const useCase = new DeletePeriodontalMeasurementUseCase(assessmentRepository, measurementRepository, auditService);

    await expect(
      useCase.execute({ assessmentId: assessment.id, measurementId: measurement.id, actorUserId: 'doc-1' }),
    ).rejects.toBeInstanceOf(PeriodontalAssessmentLockedException);
  });
});
