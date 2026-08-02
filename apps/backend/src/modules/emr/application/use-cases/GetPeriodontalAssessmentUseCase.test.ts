import { AddPeriodontalMeasurementUseCase } from './AddPeriodontalMeasurementUseCase';
import { GetPeriodontalAssessmentUseCase } from './GetPeriodontalAssessmentUseCase';
import { FakePeriodontalAssessmentRepository, FakePeriodontalMeasurementRepository } from '../../../../../tests/fakes/emrFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { PeriodontalAssessmentNotFoundException } from '../../domain/exceptions/EmrExceptions';
import { PeriodontalMeasurementPointDto } from '../dtos/SaveMeasurementRequestDto';

describe('GetPeriodontalAssessmentUseCase (task-075)', () => {
  it('rejects a non-existent assessment', async () => {
    const assessmentRepository = new FakePeriodontalAssessmentRepository();
    const measurementRepository = new FakePeriodontalMeasurementRepository();
    const useCase = new GetPeriodontalAssessmentUseCase(assessmentRepository, measurementRepository);

    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(PeriodontalAssessmentNotFoundException);
  });

  it('returns the assessment with all its measurements', async () => {
    const assessmentRepository = new FakePeriodontalAssessmentRepository();
    const measurementRepository = new FakePeriodontalMeasurementRepository();
    const auditService = new FakeAuditService();
    const assessment = await assessmentRepository.create({ visitId: 'v1', patientId: 'p1', doctorId: 'd1', createdBy: 'doc-1' });
    const addUseCase = new AddPeriodontalMeasurementUseCase(assessmentRepository, measurementRepository, auditService);
    await addUseCase.execute({
      assessmentId: assessment.id,
      toothNumber: 16,
      measurementPoint: PeriodontalMeasurementPointDto.MB,
      pocketDepth: 3,
      gingivalMargin: 0,
      bleeding: false,
      actorUserId: 'doc-1',
    });
    await addUseCase.execute({
      assessmentId: assessment.id,
      toothNumber: 16,
      measurementPoint: PeriodontalMeasurementPointDto.B,
      pocketDepth: 2,
      gingivalMargin: 0,
      bleeding: false,
      actorUserId: 'doc-1',
    });

    const useCase = new GetPeriodontalAssessmentUseCase(assessmentRepository, measurementRepository);
    const result = await useCase.execute(assessment.id);

    expect(result.id).toBe(assessment.id);
    expect(result.measurements).toHaveLength(2);
  });
});
