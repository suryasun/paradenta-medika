import { IBackgroundJobRepository } from '../../domain/repositories/IBackgroundJobRepository';

export interface OperationsHealthResult {
  queueDepth: number;
  byStatus: Record<string, number>;
  recentFailures: Array<{ id: string; jobType: string; status: string; attempts: number; lastError: string | null; traceId: string | null }>;
}

const QUEUE_DEPTH_STATUSES = ['QUEUED', 'RUNNING', 'RETRYING'];
const RECENT_FAILURES_LIMIT = 20;

/**
 * docs/06-tasks/task-194.md, UC-SYS-007: queue depth, attempts, and safe
 * (non-sensitive) error summaries only. This task was deferred in Epic AI
 * pending the background_jobs registry Epic AL builds -- now unblocked.
 */
export class GetOperationsHealthUseCase {
  constructor(private readonly backgroundJobRepository: IBackgroundJobRepository) {}

  async execute(): Promise<OperationsHealthResult> {
    const byStatus = await this.backgroundJobRepository.countByStatus();
    const queueDepth = QUEUE_DEPTH_STATUSES.reduce((sum, status) => sum + (byStatus[status] ?? 0), 0);

    const { items: failedJobs } = await this.backgroundJobRepository.list(
      { page: 1, limit: RECENT_FAILURES_LIMIT, sort: 'createdAt', order: 'desc' },
      { status: 'FAILED' },
    );
    const { items: deadLetteredJobs } = await this.backgroundJobRepository.list(
      { page: 1, limit: RECENT_FAILURES_LIMIT, sort: 'createdAt', order: 'desc' },
      { status: 'DEAD_LETTER' },
    );

    const recentFailures = [...failedJobs, ...deadLetteredJobs]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, RECENT_FAILURES_LIMIT)
      .map((job) => ({
        id: job.id,
        jobType: job.jobType,
        status: job.status,
        attempts: job.attempts,
        lastError: job.lastError,
        traceId: job.traceId,
      }));

    return { queueDepth, byStatus, recentFailures };
  }
}
