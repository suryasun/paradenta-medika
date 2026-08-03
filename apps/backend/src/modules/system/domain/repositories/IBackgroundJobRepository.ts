import { BackgroundJob, BackgroundJobStatus } from '@prisma/client';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';

export interface CreateBackgroundJobInput {
  jobType: string;
  payloadRef?: string;
  idempotencyKey: string;
  priority?: number;
  maxAttempts?: number;
  isRetryable?: boolean;
  scheduledAt?: Date;
  traceId?: string;
  correlationId?: string;
}

export interface BackgroundJobListFilter {
  jobType?: string;
  status?: BackgroundJobStatus;
}

export interface IBackgroundJobRepository {
  create(input: CreateBackgroundJobInput): Promise<BackgroundJob>;
  findById(id: string): Promise<BackgroundJob | null>;
  list(query: ListQueryDto, filter: BackgroundJobListFilter): Promise<PagedResult<BackgroundJob>>;
  updateStatus(
    id: string,
    status: BackgroundJobStatus,
    fields?: { attempts?: number; lastError?: string | null },
  ): Promise<BackgroundJob>;
  /** Aggregate counts by status -- backs task-194's Operations Health Dashboard (queue depth). */
  countByStatus(): Promise<Record<string, number>>;
}
