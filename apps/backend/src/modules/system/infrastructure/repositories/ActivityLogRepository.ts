import { ActivityLog, Prisma } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult, sanitizeSortField } from '../../../../shared/http/pagination';
import { ActivityLogFilter, IActivityLogRepository } from '../../domain/repositories/IActivityLogRepository';

const ALLOWED_SORT_FIELDS = ['createdAt'] as const;

export class ActivityLogRepository implements IActivityLogRepository {
  async query(query: ListQueryDto, filter: ActivityLogFilter): Promise<PagedResult<ActivityLog>> {
    const where: Prisma.ActivityLogWhereInput = {
      module: filter.module,
      actorUserId: filter.actorUserId,
      branchId: filter.branchId,
      action: filter.action,
      createdAt: filter.dateFrom || filter.dateTo ? { gte: filter.dateFrom, lte: filter.dateTo } : undefined,
    };
    const [items, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { [sanitizeSortField(query.sort, ALLOWED_SORT_FIELDS)]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.activityLog.count({ where }),
    ]);
    return { items, total };
  }
}
