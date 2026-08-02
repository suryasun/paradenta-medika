import { GetPeriodontalAssessmentHistoryUseCase } from './GetPeriodontalAssessmentHistoryUseCase';
import { FakePeriodontalAssessmentRepository } from '../../../../../tests/fakes/emrFakes';
import { PeriodontalAssessmentNotFoundException } from '../../domain/exceptions/EmrExceptions';

describe('GetPeriodontalAssessmentHistoryUseCase (task-076)', () => {
  it('rejects a non-existent assessment', async () => {
    const assessmentRepository = new FakePeriodontalAssessmentRepository();
    const useCase = new GetPeriodontalAssessmentHistoryUseCase(assessmentRepository);

    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(PeriodontalAssessmentNotFoundException);
  });

  it('returns prior assessments for the same patient in chronological order', async () => {
    const assessmentRepository = new FakePeriodontalAssessmentRepository();
    const first = await assessmentRepository.create({ visitId: 'v1', patientId: 'p1', doctorId: 'd1', createdBy: 'doc-1' });
    const second = await assessmentRepository.create({ visitId: 'v2', patientId: 'p1', doctorId: 'd1', createdBy: 'doc-1' });
    const third = await assessmentRepository.create({ visitId: 'v3', patientId: 'p1', doctorId: 'd1', createdBy: 'doc-1' });
    await assessmentRepository.create({ visitId: 'v4', patientId: 'other-patient', doctorId: 'd1', createdBy: 'doc-1' });

    const useCase = new GetPeriodontalAssessmentHistoryUseCase(assessmentRepository);
    const history = await useCase.execute(second.id);

    expect(history.map((a) => a.id)).toEqual([first.id, second.id, third.id]);
  });
});
