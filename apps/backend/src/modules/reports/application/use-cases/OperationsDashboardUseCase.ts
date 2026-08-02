import { IReservationRepository } from '../../../reservation/domain/repositories/IReservationRepository';
import { IQueueRepository } from '../../../queue/domain/repositories/IQueueRepository';
import { IPaymentRepository } from '../../../billing/domain/repositories/IPaymentRepository';
import { IBranchRepository } from '../../../master-data/domain/repositories/IBranchRepository';
import { DashboardMetricDto, OperationsDashboardResponseDto } from '../dtos/OperationsDashboardResponseDto';

const DEFAULT_TIMEZONE = 'Asia/Jakarta';
const QUEUE_STATUSES = ['WAITING', 'CALLED', 'IN_SERVICE', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'SKIPPED'];

function todayDate(): Date {
  return new Date(new Date().toISOString().slice(0, 10));
}

/**
 * task-059.md: SIMPLIFIED Operations Dashboard aggregating only what Phase 1
 * data already supports -- today's reservation count, today's queue counts
 * by status, and today's collected payment amount. The full multi-branch
 * "authorised scope intersection" docs/03-sad/20-module-report.md Section
 * 6.1 describes requires per-user branch assignment, which does not exist
 * until Phase 4 (task-210+); `branchId` here is applied as a direct filter,
 * not narrowed against an authorised scope -- a documented gap, not an
 * oversight.
 */
export class OperationsDashboardUseCase {
  constructor(
    private readonly reservationRepository: IReservationRepository,
    private readonly queueRepository: IQueueRepository,
    private readonly paymentRepository: IPaymentRepository,
    private readonly branchRepository: IBranchRepository,
  ) {}

  async execute(branchId?: string): Promise<OperationsDashboardResponseDto> {
    const date = todayDate();

    const [reservationCount, queueStatusCounts, collectedToday, branch] = await Promise.all([
      this.reservationRepository.countByDate(date, branchId),
      this.queueRepository.countByStatus(branchId, date),
      this.paymentRepository.sumAmountForDate(date, branchId),
      branchId ? this.branchRepository.findById(branchId) : Promise.resolve(null),
    ]);

    const metrics: DashboardMetricDto[] = [
      { code: 'reservation.today.count', value: reservationCount },
      ...QUEUE_STATUSES.map((status) => ({ code: `queue.count.${status}`, value: queueStatusCounts[status] ?? 0 })),
      { code: 'billing.collection.today', value: collectedToday, currency: 'IDR' },
    ];

    return {
      scope: { branchIds: branchId ? [branchId] : [], timezone: branch?.timezone ?? DEFAULT_TIMEZONE },
      dataAsOf: new Date().toISOString(),
      freshness: 'fresh',
      definitionVersion: '1.0.0',
      metrics,
    };
  }
}
