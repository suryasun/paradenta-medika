import { Prisma } from '@prisma/client';
import { AuditLog } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult, sanitizeSortField } from '../../../../shared/http/pagination';
import { AuditLogFilter, IAuditLogRepository } from '../../domain/repositories/IAuditLogRepository';

const ALLOWED_SORT_FIELDS = ['createdAt'] as const;

export class AuditLogRepository implements IAuditLogRepository {
  async query(query: ListQueryDto, filter: AuditLogFilter): Promise<PagedResult<AuditLog>> {
    const where: Prisma.AuditLogWhereInput = {
      userId: filter.actorUserId,
      entity: filter.entity,
      entityId: filter.entityId,
      action: filter.action,
      correlationId: filter.correlationId,
      createdAt: filter.dateFrom || filter.dateTo ? { gte: filter.dateFrom, lte: filter.dateTo } : undefined,
    };
    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { [sanitizeSortField(query.sort, ALLOWED_SORT_FIELDS)]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.auditLog.count({ where }),
    ]);
    return { items, total };
  }
}
