import { IQueueRepository } from '../../domain/repositories/IQueueRepository';
import { QueueDashboardResponseDto } from '../dtos/QueueDashboardResponseDto';
import { QueueScope } from '../services/resolveQueueScope';

function averageMinutes(diffsMs: number[]): number | null {
  if (diffsMs.length === 0) {
    return null;
  }
  const totalMs = diffsMs.reduce((sum, ms) => sum + ms, 0);
  return Math.round(totalMs / diffsMs.length / 60000);
}

/**
 * docs/06-tasks/task-047.md + docs/03-sad/14-module-queue.md Section 26
 * (Waiting/Service Time formulas) and Section 27 (Dashboard Metrics).
 */
export class QueueDashboardUseCase {
  constructor(private readonly queueRepository: IQueueRepository) {}

  async execute(branchId?: string, date?: string, scope: QueueScope = {}): Promise<QueueDashboardResponseDto> {
    const queueDate = date ? new Date(`${date}T00:00:00.000Z`) : new Date(new Date().toISOString().slice(0, 10));
    // docs/06-tasks/task-311.md/task-312.md: the dashboard's own explicit
    // branchId param combines with the resolved branch/doctor scope.
    const dashboardScope = { branchId, allowedBranchIds: scope.allowedBranchIds, restrictToDoctorId: scope.restrictToDoctorId };

    const [statusCounts, doctorCounts, completedQueues] = await Promise.all([
      this.queueRepository.countByStatus(dashboardScope, queueDate),
      this.queueRepository.countByDoctor(dashboardScope, queueDate),
      this.queueRepository.findCompletedForMetrics(dashboardScope, queueDate),
    ]);

    const waitingTimes = completedQueues
      .filter((q) => q.calledAt)
      .map((q) => q.calledAt!.getTime() - q.checkedInAt.getTime());
    const serviceTimes = completedQueues
      .filter((q) => q.startedAt && q.completedAt)
      .map((q) => q.completedAt!.getTime() - q.startedAt!.getTime());

    const totalToday = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
    const completedCount = statusCounts.COMPLETED ?? 0;

    return {
      queueSummary: {
        waiting: statusCounts.WAITING ?? 0,
        called: statusCounts.CALLED ?? 0,
        inService: statusCounts.IN_SERVICE ?? 0,
        completed: completedCount,
        cancelled: statusCounts.CANCELLED ?? 0,
        noShow: statusCounts.NO_SHOW ?? 0,
      },
      doctorSummary: doctorCounts.map((row) => ({ doctorId: row.doctorId, queueCount: row.count })),
      branchSummary: {
        totalPatientToday: totalToday,
        averageWaitingTimeMinutes: averageMinutes(waitingTimes),
        averageServiceTimeMinutes: averageMinutes(serviceTimes),
        completionRate: totalToday > 0 ? Math.round((completedCount / totalToday) * 100) / 100 : 0,
      },
    };
  }
}
