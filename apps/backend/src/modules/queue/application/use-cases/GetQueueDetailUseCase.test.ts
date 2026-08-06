import { GetQueueDetailUseCase } from './GetQueueDetailUseCase';
import { FakeQueueRepository } from '../../../../../tests/fakes/queueFakes';
import { QueueNotFoundException } from '../../domain/exceptions/QueueExceptions';

async function seedQueue(repo: FakeQueueRepository, overrides: { branchId?: string; doctorId?: string } = {}) {
  return repo.create({
    branchId: overrides.branchId ?? 'branch-a',
    patientId: 'p1',
    doctorId: overrides.doctorId ?? 'doctor-1',
    queueNumber: 'A001',
    queuePrefix: 'A',
    queueDate: new Date('2026-08-06'),
    queueType: 'WALK_IN',
    createdBy: 'staff-1',
  });
}

// docs/06-tasks/task-311.md/task-312.md
describe('GetQueueDetailUseCase', () => {
  it('returns the queue when no scope restriction applies', async () => {
    const queueRepository = new FakeQueueRepository();
    const useCase = new GetQueueDetailUseCase(queueRepository);
    const queue = await seedQueue(queueRepository);

    const result = await useCase.execute(queue.id);
    expect(result.id).toBe(queue.id);
  });

  it('reports not-found for a record outside the allowed branches', async () => {
    const queueRepository = new FakeQueueRepository();
    const useCase = new GetQueueDetailUseCase(queueRepository);
    const queue = await seedQueue(queueRepository, { branchId: 'branch-b' });

    await expect(useCase.execute(queue.id, { allowedBranchIds: ['branch-a'] })).rejects.toBeInstanceOf(QueueNotFoundException);
  });

  it('reports not-found for another doctor\'s queue entry when restricted to a doctor', async () => {
    const queueRepository = new FakeQueueRepository();
    const useCase = new GetQueueDetailUseCase(queueRepository);
    const queue = await seedQueue(queueRepository, { doctorId: 'doctor-2' });

    await expect(useCase.execute(queue.id, { restrictToDoctorId: 'doctor-1' })).rejects.toBeInstanceOf(QueueNotFoundException);
  });

  it('returns the queue when it matches both the branch and doctor scope', async () => {
    const queueRepository = new FakeQueueRepository();
    const useCase = new GetQueueDetailUseCase(queueRepository);
    const queue = await seedQueue(queueRepository, { branchId: 'branch-a', doctorId: 'doctor-1' });

    const result = await useCase.execute(queue.id, { allowedBranchIds: ['branch-a'], restrictToDoctorId: 'doctor-1' });
    expect(result.id).toBe(queue.id);
  });
});
