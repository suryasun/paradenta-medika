import { CreatePeriodontalAssessmentUseCase } from './CreatePeriodontalAssessmentUseCase';
import { FakePeriodontalAssessmentRepository, FakeVisitRepository } from '../../../../../tests/fakes/emrFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { VisitNotOpenException } from '../../domain/exceptions/EmrExceptions';

async function seedVisit(repo: FakeVisitRepository) {
  return repo.create({ visitNo: 'VIS000001', patientId: 'p1', doctorId: 'd1', branchId: 'b1', queueId: 'q1', createdBy: 'doc-1' });
}

describe('CreatePeriodontalAssessmentUseCase (task-071)', () => {
  it('rejects creating an assessment against a Completed (non-open) Visit', async () => {
    const visitRepository = new FakeVisitRepository();
    const assessmentRepository = new FakePeriodontalAssessmentRepository();
    const auditService = new FakeAuditService();
    const visit = await seedVisit(visitRepository);
    visitRepository.visits.get(visit.id)!.status = 'COMPLETED';
    const useCase = new CreatePeriodontalAssessmentUseCase(visitRepository, assessmentRepository, auditService);

    await expect(
      useCase.execute({ visitId: visit.id, patientId: 'p1', doctorId: 'd1', actorUserId: 'doc-1' }),
    ).rejects.toBeInstanceOf(VisitNotOpenException);
  });

  it('creates an assessment linked to the correct Visit and Patient', async () => {
    const visitRepository = new FakeVisitRepository();
    const assessmentRepository = new FakePeriodontalAssessmentRepository();
    const auditService = new FakeAuditService();
    const visit = await seedVisit(visitRepository);
    const useCase = new CreatePeriodontalAssessmentUseCase(visitRepository, assessmentRepository, auditService);

    const assessment = await useCase.execute({ visitId: visit.id, patientId: 'p1', doctorId: 'd1', actorUserId: 'doc-1' });

    expect(assessment.visitId).toBe(visit.id);
    expect(assessment.patientId).toBe('p1');
    expect(assessment.status).toBe('DRAFT');
    expect(auditService.records).toHaveLength(1);
  });
});
