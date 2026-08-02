import { QueueDashboardUseCase } from './QueueDashboardUseCase';
import { FakeQueueRepository } from '../../../../../tests/fakes/queueFakes';

describe('QueueDashboardUseCase (task-047)', () => {
  it('computes dashboard metrics correctly against a seeded set of queue entries in various states', async () => {
    const queueRepository = new FakeQueueRepository();
    const today = new Date(new Date().toISOString().slice(0, 10));

    const waiting = await queueRepository.create({
      branchId: 'b1',
      patientId: 'p1',
      doctorId: 'd1',
      queueNumber: 'A001',
      queuePrefix: 'A',
      queueDate: today,
      queueType: 'WALK_IN',
      createdBy: 'staff-1',
    });
    void waiting;

    const completed = await queueRepository.create({
      branchId: 'b1',
      patientId: 'p2',
      doctorId: 'd1',
      queueNumber: 'A002',
      queuePrefix: 'A',
      queueDate: today,
      queueType: 'WALK_IN',
      createdBy: 'staff-1',
    });
    const completedRow = queueRepository.queues.get(completed.id)!;
    completedRow.status = 'COMPLETED';
    completedRow.checkedInAt = new Date(Date.now() - 30 * 60000);
    completedRow.calledAt = new Date(Date.now() - 25 * 60000);
    completedRow.startedAt = new Date(Date.now() - 20 * 60000);
    completedRow.completedAt = new Date(Date.now() - 5 * 60000);

    const cancelled = await queueRepository.create({
      branchId: 'b1',
      patientId: 'p3',
      doctorId: 'd2',
      queueNumber: 'A003',
      queuePrefix: 'A',
      queueDate: today,
      queueType: 'WALK_IN',
      createdBy: 'staff-1',
    });
    queueRepository.queues.get(cancelled.id)!.status = 'CANCELLED';

    const useCase = new QueueDashboardUseCase(queueRepository);
    const dashboard = await useCase.execute('b1', today.toISOString().slice(0, 10));

    expect(dashboard.queueSummary).toEqual({ waiting: 1, called: 0, inService: 0, completed: 1, cancelled: 1, noShow: 0 });
    expect(dashboard.doctorSummary).toEqual(
      expect.arrayContaining([
        { doctorId: 'd1', queueCount: 2 },
        { doctorId: 'd2', queueCount: 1 },
      ]),
    );
    expect(dashboard.branchSummary.totalPatientToday).toBe(3);
    expect(dashboard.branchSummary.completionRate).toBeCloseTo(1 / 3, 2);
    expect(dashboard.branchSummary.averageWaitingTimeMinutes).toBe(5);
    expect(dashboard.branchSummary.averageServiceTimeMinutes).toBe(15);
  });
});
