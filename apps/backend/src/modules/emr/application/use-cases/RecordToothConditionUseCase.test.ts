import { RecordToothConditionUseCase } from './RecordToothConditionUseCase';
import { FakeOdontogramRepository, FakeVisitRepository } from '../../../../../tests/fakes/emrFakes';
import { FakeToothConditionRepository } from '../../../../../tests/fakes/masterDataFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { InvalidToothNumberException, ToothConditionNotActiveException } from '../../domain/exceptions/EmrExceptions';

async function seedVisit(repo: FakeVisitRepository) {
  return repo.create({ visitNo: 'VIS000001', patientId: 'p1', doctorId: 'd1', branchId: 'b1', queueId: 'q1', createdBy: 'doc-1' });
}

async function seedCondition(repo: FakeToothConditionRepository) {
  return repo.create({ conditionCode: 'HEALTHY', conditionName: 'Healthy', category: 'HEALTHY' });
}

describe('RecordToothConditionUseCase (task-068)', () => {
  it('rejects a tooth number outside FDI notation', async () => {
    const visitRepository = new FakeVisitRepository();
    const odontogramRepository = new FakeOdontogramRepository();
    const toothConditionRepository = new FakeToothConditionRepository();
    const auditService = new FakeAuditService();
    const visit = await seedVisit(visitRepository);
    const condition = await seedCondition(toothConditionRepository);
    const useCase = new RecordToothConditionUseCase(visitRepository, odontogramRepository, toothConditionRepository, auditService);

    await expect(
      useCase.execute({ visitId: visit.id, toothNumber: 99, toothConditionId: condition.id, actorUserId: 'doc-1' }),
    ).rejects.toBeInstanceOf(InvalidToothNumberException);
  });

  it('rejects recording against a deactivated Tooth Condition', async () => {
    const visitRepository = new FakeVisitRepository();
    const odontogramRepository = new FakeOdontogramRepository();
    const toothConditionRepository = new FakeToothConditionRepository();
    const auditService = new FakeAuditService();
    const visit = await seedVisit(visitRepository);
    const condition = await seedCondition(toothConditionRepository);
    toothConditionRepository.conditions.get(condition.id)!.isActive = false;
    const useCase = new RecordToothConditionUseCase(visitRepository, odontogramRepository, toothConditionRepository, auditService);

    await expect(
      useCase.execute({ visitId: visit.id, toothNumber: 16, toothConditionId: condition.id, actorUserId: 'doc-1' }),
    ).rejects.toBeInstanceOf(ToothConditionNotActiveException);
  });

  it('creates a new version rather than overwriting the prior state (Part 3.1C Section 24: Tooth Versioning)', async () => {
    const visitRepository = new FakeVisitRepository();
    const odontogramRepository = new FakeOdontogramRepository();
    const toothConditionRepository = new FakeToothConditionRepository();
    const auditService = new FakeAuditService();
    const visit = await seedVisit(visitRepository);
    const healthy = await seedCondition(toothConditionRepository);
    const caries = await toothConditionRepository.create({ conditionCode: 'INITIAL_CARIES', conditionName: 'Initial Caries', category: 'DISEASE' });
    const useCase = new RecordToothConditionUseCase(visitRepository, odontogramRepository, toothConditionRepository, auditService);

    const first = await useCase.execute({ visitId: visit.id, toothNumber: 16, surface: 'O', toothConditionId: healthy.id, actorUserId: 'doc-1' });
    const second = await useCase.execute({ visitId: visit.id, toothNumber: 16, surface: 'O', toothConditionId: caries.id, actorUserId: 'doc-1' });

    const allForTooth = await odontogramRepository.findByPatientIdAndTooth('p1', 16);
    expect(allForTooth).toHaveLength(2);
    expect(allForTooth.map((e) => e.id)).toEqual([first.id, second.id]);
    expect(allForTooth[0].toothConditionId).toBe(healthy.id);
    expect(allForTooth[1].toothConditionId).toBe(caries.id);
  });
});
