import { ReportJob } from '@prisma/client';
import { IReportJobRepository } from '../../domain/repositories/IReportJobRepository';
import { ReportJobNotFoundException } from '../../domain/exceptions/ReportExceptions';

/** docs/06-tasks/task-188.md: `GetReportJobUseCase` -- job progress/metadata. */
export class GetReportJobUseCase {
  constructor(private readonly reportJobRepository: IReportJobRepository) {}

  async execute(jobId: string): Promise<ReportJob> {
    const job = await this.reportJobRepository.findById(jobId);
    if (!job) {
      throw new ReportJobNotFoundException();
    }
    return job;
  }
}
