import { ActivityLog } from '@prisma/client';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';

export interface ActivityLogFilter {
  dateFrom?: Date;
  dateTo?: Date;
  module?: string;
  actorUserId?: string;
  branchId?: string;
  action?: string;
}

export interface IActivityLogRepository {
  query(query: ListQueryDto, filter: ActivityLogFilter): Promise<PagedResult<ActivityLog>>;
}
