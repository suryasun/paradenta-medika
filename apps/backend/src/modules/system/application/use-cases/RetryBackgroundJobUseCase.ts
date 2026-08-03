import { BackgroundJob } from '@prisma/client';
import { IBackgroundJobRepository } from '../../domain/repositories/IBackgroundJobRepository';
import { AuditContext, IAuditService } from '../../domain/services/IAuditService';
import { BackgroundJobNotFoundException, JobNotRetryableException } from '../../domain/exceptions/SystemExceptions';

const RETRYABLE_STATUSES = ['FAILED', 'DEAD_LETTER'];

/** docs/06-tasks/task-208.md AC: "Retry preserves the original idempotency key (no duplicate side effects)." Retry is a status transition on the SAME row -- `idempotencyKey` is never touched. */
export class RetryBackgroundJobUseCase {
  constructor(
    private readonly backgroundJobRepository: IBackgroundJobRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(jobId: string, auditContext: AuditContext): Promise<BackgroundJob> {
    const job = await this.backgroundJobRepository.findById(jobId);
    if (!job) {
      throw new BackgroundJobNotFoundException();
    }
    if (!job.isRetryable || !RETRYABLE_STATUSES.includes(job.status)) {
      throw new JobNotRetryableException();
    }
    if (job.attempts >= job.maxAttempts) {
      throw new JobNotRetryableException();
    }

    const retried = await this.backgroundJobRepository.updateStatus(jobId, 'QUEUED', { attempts: job.attempts + 1, lastError: null });

    await this.auditService.record('BackgroundJob', jobId, 'UPDATE', { status: job.status }, { status: 'QUEUED', attempts: retried.attempts }, auditContext);

    return retried;
  }
}
