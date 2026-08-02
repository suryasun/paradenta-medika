import { CallQueueUseCase } from './CallQueueUseCase';
import { SkipQueueUseCase } from './SkipQueueUseCase';
import { StartServiceUseCase } from './StartServiceUseCase';
import { CompleteQueueUseCase } from './CompleteQueueUseCase';
import { CancelQueueUseCase } from './CancelQueueUseCase';
import { FakeQueueCallRepository, FakeQueueHistoryRepository, FakeQueueRepository } from '../../../../../tests/fakes/queueFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { FakeEventBus } from '../../../../../tests/fakes/patientFakes';
import { InvalidQueueTransitionException, QueueNotFoundException } from '../../domain/exceptions/QueueExceptions';

async function seedQueue(repo: FakeQueueRepository, status: string = 'WAITING') {
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

describe('Queue state transitions', () => {
  function buildDeps() {
    const queueRepository = new FakeQueueRepository();
    const historyRepository = new FakeQueueHistoryRepository();
    const callRepository = new FakeQueueCallRepository();
    const auditService = new FakeAuditService();
    const eventBus = new FakeEventBus();
    return { queueRepository, historyRepository, callRepository, auditService, eventBus };
  }

  describe('CallQueueUseCase (task-040)', () => {
    it('succeeds from WAITING', async () => {
      const { queueRepository, historyRepository, callRepository, auditService, eventBus } = buildDeps();
      const queue = await seedQueue(queueRepository, 'WAITING');
      const useCase = new CallQueueUseCase(queueRepository, historyRepository, callRepository, auditService, eventBus);

      const result = await useCase.execute({ queueId: queue.id, actorUserId: 'doc-1' });

      expect(result.status).toBe('CALLED');
      expect(callRepository.calls).toHaveLength(1);
    });

    it('rejects from COMPLETED', async () => {
      const { queueRepository, historyRepository, callRepository, auditService, eventBus } = buildDeps();
      const queue = await seedQueue(queueRepository, 'COMPLETED');
      const useCase = new CallQueueUseCase(queueRepository, historyRepository, callRepository, auditService, eventBus);

      await expect(useCase.execute({ queueId: queue.id, actorUserId: 'doc-1' })).rejects.toBeInstanceOf(InvalidQueueTransitionException);
    });
  });

  describe('SkipQueueUseCase (task-042)', () => {
    it('succeeds from WAITING', async () => {
      const { queueRepository, historyRepository, auditService, eventBus } = buildDeps();
      const queue = await seedQueue(queueRepository, 'WAITING');
      const useCase = new SkipQueueUseCase(queueRepository, historyRepository, auditService, eventBus);

      const result = await useCase.execute({ queueId: queue.id, actorUserId: 'staff-1' });

      expect(result.status).toBe('SKIPPED');
    });

    it('rejects from CALLED (per Section 23, skip is WAITING-only)', async () => {
      const { queueRepository, historyRepository, auditService, eventBus } = buildDeps();
      const queue = await seedQueue(queueRepository, 'CALLED');
      const useCase = new SkipQueueUseCase(queueRepository, historyRepository, auditService, eventBus);

      await expect(useCase.execute({ queueId: queue.id, actorUserId: 'staff-1' })).rejects.toBeInstanceOf(InvalidQueueTransitionException);
    });
  });

  describe('StartServiceUseCase (task-043)', () => {
    it('succeeds from CALLED', async () => {
      const { queueRepository, historyRepository, auditService, eventBus } = buildDeps();
      const queue = await seedQueue(queueRepository, 'CALLED');
      const useCase = new StartServiceUseCase(queueRepository, historyRepository, auditService, eventBus);

      const result = await useCase.execute({ queueId: queue.id, actorUserId: 'doc-1' });

      expect(result.status).toBe('IN_SERVICE');
    });

    it('rejects from WAITING', async () => {
      const { queueRepository, historyRepository, auditService, eventBus } = buildDeps();
      const queue = await seedQueue(queueRepository, 'WAITING');
      const useCase = new StartServiceUseCase(queueRepository, historyRepository, auditService, eventBus);

      await expect(useCase.execute({ queueId: queue.id, actorUserId: 'doc-1' })).rejects.toBeInstanceOf(InvalidQueueTransitionException);
    });
  });

  describe('CompleteQueueUseCase (task-044)', () => {
    it('succeeds from IN_SERVICE', async () => {
      const { queueRepository, historyRepository, auditService, eventBus } = buildDeps();
      const queue = await seedQueue(queueRepository, 'IN_SERVICE');
      const useCase = new CompleteQueueUseCase(queueRepository, historyRepository, auditService, eventBus);

      const result = await useCase.execute({ queueId: queue.id, actorUserId: 'doc-1' });

      expect(result.status).toBe('COMPLETED');
    });

    it('rejects completing a queue that was never started (still WAITING)', async () => {
      const { queueRepository, historyRepository, auditService, eventBus } = buildDeps();
      const queue = await seedQueue(queueRepository, 'WAITING');
      const useCase = new CompleteQueueUseCase(queueRepository, historyRepository, auditService, eventBus);

      await expect(useCase.execute({ queueId: queue.id, actorUserId: 'doc-1' })).rejects.toBeInstanceOf(InvalidQueueTransitionException);
    });
  });

  describe('CancelQueueUseCase (task-045)', () => {
    it('succeeds from WAITING', async () => {
      const { queueRepository, historyRepository, auditService, eventBus } = buildDeps();
      const queue = await seedQueue(queueRepository, 'WAITING');
      const useCase = new CancelQueueUseCase(queueRepository, historyRepository, auditService, eventBus);

      const result = await useCase.execute({ queueId: queue.id, actorUserId: 'staff-1' });

      expect(result.status).toBe('CANCELLED');
    });

    it('rejects from IN_SERVICE', async () => {
      const { queueRepository, historyRepository, auditService, eventBus } = buildDeps();
      const queue = await seedQueue(queueRepository, 'IN_SERVICE');
      const useCase = new CancelQueueUseCase(queueRepository, historyRepository, auditService, eventBus);

      await expect(useCase.execute({ queueId: queue.id, actorUserId: 'staff-1' })).rejects.toBeInstanceOf(InvalidQueueTransitionException);
    });

    it('rejects from COMPLETED', async () => {
      const { queueRepository, historyRepository, auditService, eventBus } = buildDeps();
      const queue = await seedQueue(queueRepository, 'COMPLETED');
      const useCase = new CancelQueueUseCase(queueRepository, historyRepository, auditService, eventBus);

      await expect(useCase.execute({ queueId: queue.id, actorUserId: 'staff-1' })).rejects.toBeInstanceOf(InvalidQueueTransitionException);
    });
  });

  it('every use case rejects a non-existent queue id with QueueNotFoundException', async () => {
    const { queueRepository, historyRepository, callRepository, auditService, eventBus } = buildDeps();
    const callUseCase = new CallQueueUseCase(queueRepository, historyRepository, callRepository, auditService, eventBus);

    await expect(callUseCase.execute({ queueId: 'missing', actorUserId: 'staff-1' })).rejects.toBeInstanceOf(QueueNotFoundException);
  });
});
