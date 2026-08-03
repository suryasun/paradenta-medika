import { BackgroundJob, BackgroundJobStatus } from '@prisma/client';
import { PagedResult } from '../../../../shared/http/pagination';
import { IBackgroundJobRepository } from '../../domain/repositories/IBackgroundJobRepository';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';

export interface ListBackgroundJobQuery extends ListQueryDto {
  jobType?: string;
  status?: BackgroundJobStatus;
}

/** docs/06-tasks/task-207.md AC: "Error detail exposed via the API is sanitised" -- `lastError` is only ever written as an already-safe message by producers (the same discipline already applied to ReportJob.errorMessage/DailyClosing.lastError), so no further masking is needed at read time. */
export class ListBackgroundJobsUseCase {
  constructor(private readonly backgroundJobRepository: IBackgroundJobRepository) {}

  async execute(query: ListBackgroundJobQuery): Promise<PagedResult<BackgroundJob>> {
    return this.backgroundJobRepository.list(query, { jobType: query.jobType, status: query.status });
  }
}
