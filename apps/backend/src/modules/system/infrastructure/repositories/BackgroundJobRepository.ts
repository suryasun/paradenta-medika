import { BackgroundJob, BackgroundJobStatus, Prisma } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult, sanitizeSortField } from '../../../../shared/http/pagination';
import { BackgroundJobListFilter, CreateBackgroundJobInput, IBackgroundJobRepository } from '../../domain/repositories/IBackgroundJobRepository';

const ALLOWED_SORT_FIELDS = ['createdAt', 'priority', 'scheduledAt'] as const;

export class BackgroundJobRepository implements IBackgroundJobRepository {
  async create(input: CreateBackgroundJobInput): Promise<BackgroundJob> {
    return prisma.backgroundJob.create({
      data: {
        jobType: input.jobType,
        payloadRef: input.payloadRef,
        idempotencyKey: input.idempotencyKey,
        priority: input.priority ?? 0,
        maxAttempts: input.maxAttempts ?? 3,
        isRetryable: input.isRetryable ?? true,
        scheduledAt: input.scheduledAt,
        traceId: input.traceId,
        correlationId: input.correlationId,
      },
    });
  }

  async findById(id: string): Promise<BackgroundJob | null> {
    return prisma.backgroundJob.findUnique({ where: { id } });
  }

  async list(query: ListQueryDto, filter: BackgroundJobListFilter): Promise<PagedResult<BackgroundJob>> {
    const where: Prisma.BackgroundJobWhereInput = { jobType: filter.jobType, status: filter.status };
    const [items, total] = await Promise.all([
      prisma.backgroundJob.findMany({
        where,
        orderBy: { [sanitizeSortField(query.sort, ALLOWED_SORT_FIELDS)]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.backgroundJob.count({ where }),
    ]);
    return { items, total };
  }

  async updateStatus(
    id: string,
    status: BackgroundJobStatus,
    fields?: { attempts?: number; lastError?: string | null },
  ): Promise<BackgroundJob> {
    return prisma.backgroundJob.update({
      where: { id },
      data: { status, attempts: fields?.attempts, lastError: fields?.lastError },
    });
  }

  async countByStatus(): Promise<Record<string, number>> {
    const rows = await prisma.backgroundJob.groupBy({ by: ['status'], _count: { _all: true } });
    const result: Record<string, number> = {};
    for (const row of rows) {
      result[row.status] = row._count._all;
    }
    return result;
  }
}
