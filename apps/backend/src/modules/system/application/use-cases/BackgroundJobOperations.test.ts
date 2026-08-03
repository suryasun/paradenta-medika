import { ListBackgroundJobsUseCase } from './ListBackgroundJobsUseCase';
import { GetBackgroundJobUseCase } from './GetBackgroundJobUseCase';
import { RetryBackgroundJobUseCase } from './RetryBackgroundJobUseCase';
import { CancelBackgroundJobUseCase } from './CancelBackgroundJobUseCase';
import { GetOperationsHealthUseCase } from './GetOperationsHealthUseCase';
import { BackgroundJobNotFoundException, JobAlreadySucceededException, JobNotRetryableException } from '../../domain/exceptions/SystemExceptions';
import { FakeBackgroundJobRepository } from '../../../../../tests/fakes/systemFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';

function auditCtx(userId: string) {
  return { userId };
}

function buildSut() {
  const backgroundJobRepository = new FakeBackgroundJobRepository();
  const auditService = new FakeAuditService();
  return {
    backgroundJobRepository,
    auditService,
    listUseCase: new ListBackgroundJobsUseCase(backgroundJobRepository),
    getUseCase: new GetBackgroundJobUseCase(backgroundJobRepository),
    retryUseCase: new RetryBackgroundJobUseCase(backgroundJobRepository, auditService),
    cancelUseCase: new CancelBackgroundJobUseCase(backgroundJobRepository, auditService),
    healthUseCase: new GetOperationsHealthUseCase(backgroundJobRepository),
  };
}

describe('Background Job Operations (task-207-209, UC-SYS-007)', () => {
  it('GetBackgroundJobUseCase throws for an unknown job', async () => {
    const { getUseCase } = buildSut();
    await expect(getUseCase.execute('does-not-exist')).rejects.toBeInstanceOf(BackgroundJobNotFoundException);
  });

  it('retry preserves the original idempotency key (no duplicate side effects)', async () => {
    const { backgroundJobRepository, retryUseCase } = buildSut();
    const job = await backgroundJobRepository.create({ jobType: 'notification.delivery', idempotencyKey: 'idem-1' });
    await backgroundJobRepository.updateStatus(job.id, 'FAILED', { attempts: 1, lastError: 'transient timeout' });

    const retried = await retryUseCase.execute(job.id, auditCtx('admin-1'));

    expect(retried.idempotencyKey).toBe('idem-1');
    expect(retried.status).toBe('QUEUED');
    expect(retried.attempts).toBe(2);
  });

  it('rejects retrying a non-retryable job type with SYS_JOB_NOT_RETRYABLE', async () => {
    const { backgroundJobRepository, retryUseCase } = buildSut();
    const job = await backgroundJobRepository.create({ jobType: 'one-shot.migration', idempotencyKey: 'idem-2', isRetryable: false });
    await backgroundJobRepository.updateStatus(job.id, 'FAILED', { attempts: 1 });

    await expect(retryUseCase.execute(job.id, auditCtx('admin-1'))).rejects.toBeInstanceOf(JobNotRetryableException);
  });

  it('rejects retrying a job that has already exhausted its max attempts', async () => {
    const { backgroundJobRepository, retryUseCase } = buildSut();
    const job = await backgroundJobRepository.create({ jobType: 'notification.delivery', idempotencyKey: 'idem-3', maxAttempts: 3 });
    await backgroundJobRepository.updateStatus(job.id, 'FAILED', { attempts: 3 });

    await expect(retryUseCase.execute(job.id, auditCtx('admin-1'))).rejects.toBeInstanceOf(JobNotRetryableException);
  });

  it('rejects retrying a job that is not in a retryable status (e.g. SUCCEEDED)', async () => {
    const { backgroundJobRepository, retryUseCase } = buildSut();
    const job = await backgroundJobRepository.create({ jobType: 'notification.delivery', idempotencyKey: 'idem-4' });
    await backgroundJobRepository.updateStatus(job.id, 'SUCCEEDED', { attempts: 1 });

    await expect(retryUseCase.execute(job.id, auditCtx('admin-1'))).rejects.toBeInstanceOf(JobNotRetryableException);
  });

  it('cancelling a queued job marks it cancelled', async () => {
    const { backgroundJobRepository, cancelUseCase } = buildSut();
    const job = await backgroundJobRepository.create({ jobType: 'notification.delivery', idempotencyKey: 'idem-5' });

    const cancelled = await cancelUseCase.execute(job.id, auditCtx('admin-1'));
    expect(cancelled.status).toBe('CANCELLED');
  });

  it('rejects cancelling an already-SUCCEEDED job -- does not silently lose the compensation requirement', async () => {
    const { backgroundJobRepository, cancelUseCase } = buildSut();
    const job = await backgroundJobRepository.create({ jobType: 'notification.delivery', idempotencyKey: 'idem-6' });
    await backgroundJobRepository.updateStatus(job.id, 'SUCCEEDED');

    await expect(cancelUseCase.execute(job.id, auditCtx('admin-1'))).rejects.toBeInstanceOf(JobAlreadySucceededException);
  });

  it('cancelling an already-cancelled job is an idempotent no-op', async () => {
    const { backgroundJobRepository, cancelUseCase } = buildSut();
    const job = await backgroundJobRepository.create({ jobType: 'notification.delivery', idempotencyKey: 'idem-7' });
    await backgroundJobRepository.updateStatus(job.id, 'CANCELLED');

    const result = await cancelUseCase.execute(job.id, auditCtx('admin-1'));
    expect(result.status).toBe('CANCELLED');
  });

  it('lists jobs filtered by status', async () => {
    const { backgroundJobRepository, listUseCase } = buildSut();
    const job1 = await backgroundJobRepository.create({ jobType: 'notification.delivery', idempotencyKey: 'idem-8' });
    await backgroundJobRepository.create({ jobType: 'report.job', idempotencyKey: 'idem-9' });
    await backgroundJobRepository.updateStatus(job1.id, 'FAILED', { attempts: 1 });

    const { items, total } = await listUseCase.execute({ page: 1, limit: 20, sort: 'createdAt', order: 'desc', status: 'FAILED' });
    expect(total).toBe(1);
    expect(items[0].id).toBe(job1.id);
  });

  it('GetOperationsHealthUseCase reports queue depth (queued/running/retrying) and only safe error summaries', async () => {
    const { backgroundJobRepository, healthUseCase } = buildSut();
    await backgroundJobRepository.create({ jobType: 'notification.delivery', idempotencyKey: 'idem-10' }); // QUEUED
    const running = await backgroundJobRepository.create({ jobType: 'report.job', idempotencyKey: 'idem-11' });
    await backgroundJobRepository.updateStatus(running.id, 'RUNNING');
    const failed = await backgroundJobRepository.create({ jobType: 'notification.delivery', idempotencyKey: 'idem-12' });
    await backgroundJobRepository.updateStatus(failed.id, 'FAILED', { attempts: 3, lastError: 'provider timeout (safe message)' });

    const health = await healthUseCase.execute();
    expect(health.queueDepth).toBe(2); // QUEUED + RUNNING
    expect(health.byStatus.FAILED).toBe(1);
    expect(health.recentFailures).toHaveLength(1);
    expect(health.recentFailures[0].lastError).toBe('provider timeout (safe message)');
  });
});
