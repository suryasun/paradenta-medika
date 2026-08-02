/**
 * docs/03-sad/14-module-queue.md Section 27 Queue Dashboard Metrics.
 * "Doctor Active/Idle" and "Queue Capacity" are omitted: no real-time
 * doctor-presence tracking or branch Maximum-Queue configuration exists in
 * the Phase 1 schema.
 */
export interface QueueDashboardResponseDto {
  queueSummary: {
    waiting: number;
    called: number;
    inService: number;
    completed: number;
    cancelled: number;
    noShow: number;
  };
  doctorSummary: Array<{ doctorId: string; queueCount: number }>;
  branchSummary: {
    totalPatientToday: number;
    averageWaitingTimeMinutes: number | null;
    averageServiceTimeMinutes: number | null;
    completionRate: number;
  };
}
