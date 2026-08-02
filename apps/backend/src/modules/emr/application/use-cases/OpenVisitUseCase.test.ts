import { OpenVisitUseCase } from './OpenVisitUseCase';
import { VisitNumberGenerator } from '../services/VisitNumberGenerator';
import { FakeVisitRepository } from '../../../../../tests/fakes/emrFakes';
import { FakeQueueRepository } from '../../../../../tests/fakes/queueFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { QueueAlreadyHasVisitException, QueueNotCalledException } from '../../domain/exceptions/EmrExceptions';

async function seedQueue(repo: FakeQueueRepository, status: string) {
  const queue = await repo.create({
    branchId: 'b1',
    patientId: 'p1',
    doctorId: 'd1',
    queueNumber: 'A001',
    queuePrefix: 'A',
    queueDate: new Date(),
    queueType: 'WALK_IN',
    createdBy: 'staff-1',
  });
  repo.queues.get(queue.id)!.status = status as never;
  return queue;
}

describe('OpenVisitUseCase (task-048)', () => {
  function buildSut() {
    const visitRepository = new FakeVisitRepository();
    const queueRepository = new FakeQueueRepository();
    const visitNumberGenerator = new VisitNumberGenerator(visitRepository);
    const auditService = new FakeAuditService();
    const useCase = new OpenVisitUseCase(visitRepository, queueRepository, visitNumberGenerator, auditService);
    return { visitRepository, queueRepository, useCase };
  }

  it('opens a visit correctly linked to Doctor/Patient/Branch/Queue when the queue is CALLED', async () => {
    const { queueRepository, useCase } = buildSut();
    const queue = await seedQueue(queueRepository, 'CALLED');

    const visit = await useCase.execute({ queueId: queue.id, actorUserId: 'doc-1' });

    expect(visit.doctorId).toBe(queue.doctorId);
    expect(visit.patientId).toBe(queue.patientId);
    expect(visit.branchId).toBe(queue.branchId);
    expect(visit.queueId).toBe(queue.id);
    expect(visit.status).toBe('DRAFT');
  });

  it('rejects opening a visit from a non-CALLED queue', async () => {
    const { queueRepository, useCase } = buildSut();
    const queue = await seedQueue(queueRepository, 'WAITING');

    await expect(useCase.execute({ queueId: queue.id, actorUserId: 'doc-1' })).rejects.toBeInstanceOf(QueueNotCalledException);
  });

  it('rejects opening a second visit for a queue that already has one', async () => {
    const { queueRepository, useCase } = buildSut();
    const queue = await seedQueue(queueRepository, 'CALLED');
    await useCase.execute({ queueId: queue.id, actorUserId: 'doc-1' });

    await expect(useCase.execute({ queueId: queue.id, actorUserId: 'doc-1' })).rejects.toBeInstanceOf(QueueAlreadyHasVisitException);
  });
});
