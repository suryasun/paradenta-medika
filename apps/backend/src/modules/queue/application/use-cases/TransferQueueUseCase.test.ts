import { TransferQueueUseCase } from './TransferQueueUseCase';
import { FakeQueueHistoryRepository, FakeQueueRepository } from '../../../../../tests/fakes/queueFakes';
import { FakeDoctorRepository } from '../../../../../tests/fakes/masterDataFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { InvalidQueueTransitionException } from '../../domain/exceptions/QueueExceptions';

describe('TransferQueueUseCase (task-046)', () => {
  it('updates doctorId and records the reason in the Audit Trail', async () => {
    const queueRepository = new FakeQueueRepository();
    const doctorRepository = new FakeDoctorRepository();
    const historyRepository = new FakeQueueHistoryRepository();
    const auditService = new FakeAuditService();
    const newDoctor = await doctorRepository.create({ doctorCode: 'DOC02', userId: 'u2', branchId: 'b1', fullName: 'Dr. New' });
    const queue = await queueRepository.create({
      branchId: 'b1',
      patientId: 'p1',
      doctorId: 'old-doctor',
      queueNumber: 'A001',
      queuePrefix: 'A',
      queueDate: new Date(),
      queueType: 'WALK_IN',
      createdBy: 'staff-1',
    });
    const useCase = new TransferQueueUseCase(queueRepository, doctorRepository, historyRepository, auditService);

    const result = await useCase.execute({ queueId: queue.id, doctorId: newDoctor.id, reason: 'Original doctor unavailable', actorUserId: 'staff-1' });

    expect(result.doctorId).toBe(newDoctor.id);
    expect(auditService.records).toHaveLength(1);
    expect(historyRepository.entries).toHaveLength(1);
  });

  it('rejects transferring a queue already IN_SERVICE', async () => {
    const queueRepository = new FakeQueueRepository();
    const doctorRepository = new FakeDoctorRepository();
    const historyRepository = new FakeQueueHistoryRepository();
    const auditService = new FakeAuditService();
    const newDoctor = await doctorRepository.create({ doctorCode: 'DOC03', userId: 'u3', branchId: 'b1', fullName: 'Dr. New' });
    const queue = await queueRepository.create({
      branchId: 'b1',
      patientId: 'p1',
      doctorId: 'old-doctor',
      queueNumber: 'A001',
      queuePrefix: 'A',
      queueDate: new Date(),
      queueType: 'WALK_IN',
      createdBy: 'staff-1',
    });
    queueRepository.queues.get(queue.id)!.status = 'IN_SERVICE';
    const useCase = new TransferQueueUseCase(queueRepository, doctorRepository, historyRepository, auditService);

    await expect(
      useCase.execute({ queueId: queue.id, doctorId: newDoctor.id, reason: 'x', actorUserId: 'staff-1' }),
    ).rejects.toBeInstanceOf(InvalidQueueTransitionException);
  });
});
