import { BackgroundJob } from '@prisma/client';
import { IBackgroundJobRepository } from '../../domain/repositories/IBackgroundJobRepository';
import { AuditContext, IAuditService } from '../../domain/services/IAuditService';
import { BackgroundJobNotFoundException, JobAlreadySucceededException } from '../../domain/exceptions/SystemExceptions';

const ALREADY_TERMINAL_NO_OP_STATUSES = ['CANCELLED', 'FAILED', 'DEAD_LETTER'];
const CANCELLABLE_STATUSES = ['QUEUED', 'RUNNING', 'RETRYING'];

/**
 * docs/06-tasks/task-209.md, UC-SYS-007: "Cancel is best effort: running
 * job checks cancellation signal and any external side effect must use a
 * compensation/idempotency protocol." A SUCCEEDED job already committed
 * its external side effect, so cancel is explicitly rejected here
 * (JobAlreadySucceededException) rather than silently no-op'd -- per the
 * task's own AC, this must not "silently lose the compensation
 * requirement." An already-cancelled/failed/dead-lettered job has no
 * pending side effect to stop, so cancelling it again is a harmless
 * idempotent no-op.
 */
export class CancelBackgroundJobUseCase {
  constructor(
    private readonly backgroundJobRepository: IBackgroundJobRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(jobId: string, auditContext: AuditContext): Promise<BackgroundJob> {
    const job = await this.backgroundJobRepository.findById(jobId);
    if (!job) {
      throw new BackgroundJobNotFoundException();
    }
    if (job.status === 'SUCCEEDED') {
      throw new JobAlreadySucceededException();
    }
    if (ALREADY_TERMINAL_NO_OP_STATUSES.includes(job.status)) {
      return job;
    }
    if (!CANCELLABLE_STATUSES.includes(job.status)) {
      return job;
    }

    const cancelled = await this.backgroundJobRepository.updateStatus(jobId, 'CANCELLED');

    await this.auditService.record('BackgroundJob', jobId, 'UPDATE', { status: job.status }, { status: 'CANCELLED' }, auditContext);

    return cancelled;
  }
}
