import { ActivityLog } from '@prisma/client';
import { PagedResult } from '../../../../shared/http/pagination';
import { IActivityLogRepository } from '../../domain/repositories/IActivityLogRepository';
import { ActivityLogQueryDto } from '../dtos/ActivityLogQueryDto';

/**
 * docs/06-tasks/task-193.md, SAD Section 4.1 Actor Matrix: "View audit/job
 * health | ... limited (Clinic Manager)". No Clinic Manager role exists
 * in this codebase's seeded RBAC yet (roles are ADMINISTRATOR/DOCTOR/
 * REGISTRATION/CASHIER/WAREHOUSE_STAFF/WAREHOUSE_MANAGER/FINANCE_STAFF/
 * FINANCE_MANAGER) -- the "limited view" tier
 * is gated by permission (`system.activity.read`) only for now; a
 * per-role column-level restriction can be layered on once that role is
 * introduced (Phase 4/5 RBAC work).
 */
export class QueryActivityLogsUseCase {
  constructor(private readonly activityLogRepository: IActivityLogRepository) {}

  async execute(query: ActivityLogQueryDto): Promise<PagedResult<ActivityLog>> {
    return this.activityLogRepository.query(query, {
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      module: query.module,
      actorUserId: query.actorUserId,
      branchId: query.branchId,
      action: query.action,
    });
  }
}
