import { ReportJob } from '@prisma/client';
import { IReportJobRepository } from '../../domain/repositories/IReportJobRepository';
import { ReportJobNotFoundException } from '../../domain/exceptions/ReportExceptions';

const CANCELLABLE_STATUSES = ['QUEUED', 'RUNNING'];

/** docs/06-tasks/task-189.md AC: "Cancel on an already-completed job is a no-op, not an error." */
export class CancelReportJobUseCase {
  constructor(private readonly reportJobRepository: IReportJobRepository) {}

  async execute(jobId: string): Promise<ReportJob> {
    const job = await this.reportJobRepository.findById(jobId);
    if (!job) {
      throw new ReportJobNotFoundException();
    }
    if (!CANCELLABLE_STATUSES.includes(job.status)) {
      return job;
    }
    return this.reportJobRepository.markStatus(jobId, 'CANCELLED', { finishedAt: new Date() });
  }
}
