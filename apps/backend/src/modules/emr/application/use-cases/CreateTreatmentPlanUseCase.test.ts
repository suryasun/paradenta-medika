import { CreateTreatmentPlanUseCase } from './CreateTreatmentPlanUseCase';
import { TreatmentPlanPriorityDto } from '../dtos/CreateTreatmentPlanRequestDto';
import { FakeTreatmentPlanRepository, FakeTreatmentRepository, FakeVisitRepository } from '../../../../../tests/fakes/emrFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { TreatmentNotActiveException } from '../../domain/exceptions/EmrExceptions';

async function seedVisit(repo: FakeVisitRepository) {
  return repo.create({ visitNo: 'VIS000001', patientId: 'p1', doctorId: 'd1', branchId: 'b1', queueId: 'q1', createdBy: 'doc-1' });
}

describe('CreateTreatmentPlanUseCase (task-063)', () => {
  it('rejects a plan item referencing a deactivated Treatment catalog entry', async () => {
    const visitRepository = new FakeVisitRepository();
    const treatmentPlanRepository = new FakeTreatmentPlanRepository();
    const treatmentRepository = new FakeTreatmentRepository();
    const auditService = new FakeAuditService();
    const visit = await seedVisit(visitRepository);
    const treatment = await treatmentRepository.create({ treatmentCode: 'T01', treatmentName: 'Root Canal', treatmentCategoryId: 'c1', defaultPrice: 1200000 });
    treatmentRepository.treatments.get(treatment.id)!.isActive = false;
    const useCase = new CreateTreatmentPlanUseCase(visitRepository, treatmentPlanRepository, treatmentRepository, auditService);

    await expect(
      useCase.execute({
        visitId: visit.id,
        items: [{ treatmentId: treatment.id, estimatedCost: 1200000 }],
        actorUserId: 'doc-1',
      }),
    ).rejects.toBeInstanceOf(TreatmentNotActiveException);
  });

  it('persists plan items with estimated cost/duration and priority, referencing the Treatment master catalog', async () => {
    const visitRepository = new FakeVisitRepository();
    const treatmentPlanRepository = new FakeTreatmentPlanRepository();
    const treatmentRepository = new FakeTreatmentRepository();
    const auditService = new FakeAuditService();
    const visit = await seedVisit(visitRepository);
    const rct = await treatmentRepository.create({ treatmentCode: 'T02', treatmentName: 'Root Canal', treatmentCategoryId: 'c1', defaultPrice: 1200000 });
    const crown = await treatmentRepository.create({ treatmentCode: 'T03', treatmentName: 'Crown', treatmentCategoryId: 'c1', defaultPrice: 2500000 });
    const useCase = new CreateTreatmentPlanUseCase(visitRepository, treatmentPlanRepository, treatmentRepository, auditService);

    const items = await useCase.execute({
      visitId: visit.id,
      items: [
        { treatmentId: rct.id, toothNumber: 16, priority: TreatmentPlanPriorityDto.HIGH, estimatedCost: 1200000, estimatedDurationMinute: 90 },
        { treatmentId: crown.id, toothNumber: 16, priority: TreatmentPlanPriorityDto.MEDIUM, estimatedCost: 2500000 },
      ],
      actorUserId: 'doc-1',
    });

    expect(items).toHaveLength(2);
    expect(items[0].priority).toBe('HIGH');
    expect(items[0].estimatedCost).toBe(1200000);
    expect(items[0].estimatedDurationMinute).toBe(90);
    expect(items[0].patientId).toBe('p1');
    expect(auditService.records).toHaveLength(1);
  });
});
