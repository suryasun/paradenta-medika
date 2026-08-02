import { OperationsDashboardUseCase } from './OperationsDashboardUseCase';
import { FakeReservationRepository } from '../../../../../tests/fakes/reservationFakes';
import { FakeQueueRepository } from '../../../../../tests/fakes/queueFakes';
import { FakePaymentRepository } from '../../../../../tests/fakes/billingFakes';
import { FakeBranchRepository } from '../../../../../tests/fakes/masterDataFakes';
import { parseTimeToDate } from '../../../reservation/application/services/timeUtils';

function todayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

describe('OperationsDashboardUseCase (task-059)', () => {
  it('computes accurate metrics against seeded Reservation/Queue/Payment data', async () => {
    const reservationRepository = new FakeReservationRepository();
    const queueRepository = new FakeQueueRepository();
    const paymentRepository = new FakePaymentRepository();
    const branchRepository = new FakeBranchRepository();
    const useCase = new OperationsDashboardUseCase(reservationRepository, queueRepository, paymentRepository, branchRepository);

    await reservationRepository.create({
      reservationNo: 'RSV-1',
      patientId: 'p1',
      doctorId: 'd1',
      branchId: 'b1',
      reservationDate: todayUtc(),
      reservationTime: parseTimeToDate('09:00'),
      reservationType: 'APPOINTMENT',
      source: 'PHONE',
      createdBy: 'staff-1',
    });
    await reservationRepository.create({
      reservationNo: 'RSV-2',
      patientId: 'p2',
      doctorId: 'd1',
      branchId: 'b1',
      reservationDate: todayUtc(),
      reservationTime: parseTimeToDate('10:00'),
      reservationType: 'APPOINTMENT',
      source: 'PHONE',
      createdBy: 'staff-1',
    });

    const queue1 = await queueRepository.create({
      branchId: 'b1',
      patientId: 'p1',
      doctorId: 'd1',
      queueNumber: 'A001',
      queuePrefix: 'A',
      queueDate: todayUtc(),
      queueType: 'WALK_IN',
      createdBy: 'staff-1',
    });
    await queueRepository.create({
      branchId: 'b1',
      patientId: 'p2',
      doctorId: 'd1',
      queueNumber: 'A002',
      queuePrefix: 'A',
      queueDate: todayUtc(),
      queueType: 'WALK_IN',
      createdBy: 'staff-1',
    });
    await queueRepository.updateStatus(queue1.id, 'COMPLETED', 'completedAt', 'staff-1');

    await paymentRepository.create({ invoiceId: 'inv-1', paymentMethodId: 'pm-1', amount: 150000, receivedBy: 'cashier-1', createdBy: 'cashier-1' });
    await paymentRepository.create({ invoiceId: 'inv-2', paymentMethodId: 'pm-1', amount: 250000, receivedBy: 'cashier-1', createdBy: 'cashier-1' });

    const result = await useCase.execute();

    expect(result.metrics.find((m) => m.code === 'reservation.today.count')?.value).toBe(2);
    expect(result.metrics.find((m) => m.code === 'queue.count.WAITING')?.value).toBe(1);
    expect(result.metrics.find((m) => m.code === 'queue.count.COMPLETED')?.value).toBe(1);
    expect(result.metrics.find((m) => m.code === 'billing.collection.today')?.value).toBe(400000);
    expect(result.freshness).toBe('fresh');
  });

  it('scopes metrics to a single branch when branchId is provided, using that branch timezone', async () => {
    const reservationRepository = new FakeReservationRepository();
    const queueRepository = new FakeQueueRepository();
    const paymentRepository = new FakePaymentRepository();
    const branchRepository = new FakeBranchRepository();
    const useCase = new OperationsDashboardUseCase(reservationRepository, queueRepository, paymentRepository, branchRepository);

    const branch = await branchRepository.create({
      clinicId: 'c1',
      branchCode: 'BR1',
      branchName: 'Branch 1',
      phone: '021',
      email: 'branch1@example.com',
      address: 'Jl. Contoh',
      timezone: 'Asia/Makassar',
    });
    const otherBranch = await branchRepository.create({
      clinicId: 'c1',
      branchCode: 'BR2',
      branchName: 'Branch 2',
      phone: '021',
      email: 'branch2@example.com',
      address: 'Jl. Lain',
    });

    await reservationRepository.create({
      reservationNo: 'RSV-1',
      patientId: 'p1',
      doctorId: 'd1',
      branchId: branch.id,
      reservationDate: todayUtc(),
      reservationTime: parseTimeToDate('09:00'),
      reservationType: 'APPOINTMENT',
      source: 'PHONE',
      createdBy: 'staff-1',
    });
    await reservationRepository.create({
      reservationNo: 'RSV-2',
      patientId: 'p2',
      doctorId: 'd1',
      branchId: otherBranch.id,
      reservationDate: todayUtc(),
      reservationTime: parseTimeToDate('10:00'),
      reservationType: 'APPOINTMENT',
      source: 'PHONE',
      createdBy: 'staff-1',
    });

    const result = await useCase.execute(branch.id);

    expect(result.metrics.find((m) => m.code === 'reservation.today.count')?.value).toBe(1);
    expect(result.scope.branchIds).toEqual([branch.id]);
    expect(result.scope.timezone).toBe('Asia/Makassar');
  });
});
