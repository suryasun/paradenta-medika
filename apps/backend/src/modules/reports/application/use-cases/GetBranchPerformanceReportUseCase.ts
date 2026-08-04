import { QueueDashboardUseCase } from '../../../queue/application/use-cases/QueueDashboardUseCase';
import { IPaymentRepository } from '../../../billing/domain/repositories/IPaymentRepository';
import { BranchAuthorizationService } from '../services/BranchAuthorizationService';
import { ReportFilterInvalidException, ReportRangeTooLargeException } from '../../domain/exceptions/ReportExceptions';

const MAX_RANGE_DAYS = 90;

export interface BranchPerformancePeriodEntry {
  date: string;
  totalPatients: number;
  averageWaitingTimeMinutes: number | null;
  completionRate: number;
  doctorProductivity: Array<{ doctorId: string; queueCount: number }>;
  billingCollected: number;
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function enumerateDates(dateFrom: Date, dateTo: Date): Date[] {
  const dates: Date[] = [];
  const cursor = new Date(dateFrom);
  while (cursor.getTime() <= dateTo.getTime()) {
    dates.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

/**
 * docs/06-tasks/task-220.md: queue throughput/wait-time, doctor
 * productivity, and billing collection per branch, trended day-by-day over
 * the requested period -- distinct from task-218/219's point-in-time
 * snapshots. Built from already-existing per-date-capable read paths
 * (QueueDashboardUseCase, IPaymentRepository.sumAmountForDate) rather than
 * a new report_snapshots time-series query capability that doesn't exist
 * in this codebase yet (no periodic snapshot job populates that table for
 * this report), per this task's own flagged ambiguity.
 */
export class GetBranchPerformanceReportUseCase {
  constructor(
    private readonly queueDashboardUseCase: QueueDashboardUseCase,
    private readonly paymentRepository: IPaymentRepository,
    private readonly branchAuthorizationService: BranchAuthorizationService,
  ) {}

  async execute(
    branchId: string,
    requesterUserId: string,
    dateFrom: string,
    dateTo: string,
  ): Promise<BranchPerformancePeriodEntry[]> {
    await this.branchAuthorizationService.assertBranchInScope(requesterUserId, branchId);

    const from = new Date(`${dateFrom}T00:00:00.000Z`);
    const to = new Date(`${dateTo}T00:00:00.000Z`);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw new ReportFilterInvalidException('dateFrom/dateTo must be valid dates');
    }
    if (from.getTime() > to.getTime()) {
      throw new ReportFilterInvalidException('dateFrom must not be after dateTo');
    }
    const days = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
    if (days > MAX_RANGE_DAYS) {
      throw new ReportRangeTooLargeException();
    }

    const periods = enumerateDates(from, to);
    return Promise.all(
      periods.map(async (date) => {
        const dateStr = toDateOnly(date);
        const [queue, billingCollected] = await Promise.all([
          this.queueDashboardUseCase.execute(branchId, dateStr),
          this.paymentRepository.sumAmountForDate(date, branchId),
        ]);
        return {
          date: dateStr,
          totalPatients: queue.branchSummary.totalPatientToday,
          averageWaitingTimeMinutes: queue.branchSummary.averageWaitingTimeMinutes,
          completionRate: queue.branchSummary.completionRate,
          doctorProductivity: queue.doctorSummary,
          billingCollected,
        };
      }),
    );
  }
}
