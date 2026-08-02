import { RecallQueueUseCase } from './RecallQueueUseCase';
import { FakeQueueCallRepository, FakeQueueRepository } from '../../../../../tests/fakes/queueFakes';
import { InvalidQueueTransitionException } from '../../domain/exceptions/QueueExceptions';

describe('RecallQueueUseCase (task-041)', () => {
  it('does not change queue position or status beyond re-signaling', async () => {
    const queueRepository = new FakeQueueRepository();
    const callRepository = new FakeQueueCallRepository();
    const queue = await queueRepository.create({
      branchId: 'b1',
      patientId: 'p1',
      doctorId: 'd1',
      queueNumber: 'A001',
      queuePrefix: 'A',
      queueDate: new Date(),
      queueType: 'WALK_IN',
      createdBy: 'staff-1',
    });
    queueRepository.queues.get(queue.id)!.status = 'CALLED';
    const useCase = new RecallQueueUseCase(queueRepository, callRepository);

    const result = await useCase.execute({ queueId: queue.id, actorUserId: 'doc-1' });

    expect(result.status).toBe('CALLED');
    expect(callRepository.calls).toHaveLength(1);
  });

  it('rejects recalling a queue that is not currently CALLED', async () => {
    const queueRepository = new FakeQueueRepository();
    const callRepository = new FakeQueueCallRepository();
    const queue = await queueRepository.create({
      branchId: 'b1',
      patientId: 'p1',
      doctorId: 'd1',
      queueNumber: 'A001',
      queuePrefix: 'A',
      queueDate: new Date(),
      queueType: 'WALK_IN',
      createdBy: 'staff-1',
    });
    const useCase = new RecallQueueUseCase(queueRepository, callRepository);

    await expect(useCase.execute({ queueId: queue.id, actorUserId: 'doc-1' })).rejects.toBeInstanceOf(InvalidQueueTransitionException);
  });
});
