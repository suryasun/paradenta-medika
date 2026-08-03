import { PagedResult } from '../../../../shared/http/pagination';
import { IAuditLogRepository } from '../../domain/repositories/IAuditLogRepository';
import { AuditContext, IAuditService } from '../../domain/services/IAuditService';
import { AuditLogQueryDto } from '../dtos/AuditLogQueryDto';
import { AuditLogResponseDto } from '../dtos/AuditLogResponseDto';
import { toAuditLogResponseDto } from '../mappers/AuditLogMapper';

/** docs/06-tasks/task-192.md, UC-SYS-006: "Audit query/export itself produces an audit event." */
export class QueryAuditLogsUseCase {
  constructor(
    private readonly auditLogRepository: IAuditLogRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(query: AuditLogQueryDto, auditContext: AuditContext): Promise<PagedResult<AuditLogResponseDto>> {
    const { items, total } = await this.auditLogRepository.query(query, {
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      actorUserId: query.actorUserId,
      entity: query.entity,
      entityId: query.entityId,
      action: query.action,
      correlationId: query.correlationId,
    });

    await this.auditService.record('AuditLog', 'query', 'READ', null, { filters: query as unknown as Record<string, unknown> }, auditContext);

    return { items: items.map(toAuditLogResponseDto), total };
  }
}
