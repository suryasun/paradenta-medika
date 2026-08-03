import { AuditLog } from '@prisma/client';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';

/**
 * docs/03-sad/21-module-system.md Section 5.4 `audit_logs` documents
 * actor/action/target/before-after-diff/outcome/IP/correlation columns,
 * but the actual table this codebase's AuditService (task-006) writes to
 * -- used unmodified by every module built so far -- only has
 * entity/entityId/action/oldValue/newValue/userId/ipAddress/
 * correlationId/createdAt: no module, branch, or outcome column exists.
 * Retrofitting those into every one of this codebase's existing
 * `auditService.record()` call sites is out of this task's scope (a
 * codebase-wide change touching every already-shipped module), so this
 * filter set only covers what the table genuinely stores -- a documented
 * gap, not an oversight.
 */
export interface AuditLogFilter {
  dateFrom?: Date;
  dateTo?: Date;
  actorUserId?: string;
  entity?: string;
  entityId?: string;
  action?: string;
  correlationId?: string;
}

export interface IAuditLogRepository {
  query(query: ListQueryDto, filter: AuditLogFilter): Promise<PagedResult<AuditLog>>;
}
