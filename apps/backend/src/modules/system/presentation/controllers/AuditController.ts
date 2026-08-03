import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { buildPaginationMeta } from '../../../../shared/http/pagination';
import { AuditLogQueryDto } from '../../application/dtos/AuditLogQueryDto';
import { ActivityLogQueryDto } from '../../application/dtos/ActivityLogQueryDto';
import { QueryAuditLogsUseCase } from '../../application/use-cases/QueryAuditLogsUseCase';
import { QueryActivityLogsUseCase } from '../../application/use-cases/QueryActivityLogsUseCase';

export class AuditController {
  constructor(
    private readonly queryAuditLogsUseCase: QueryAuditLogsUseCase,
    private readonly queryActivityLogsUseCase: QueryActivityLogsUseCase,
  ) {}

  auditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as AuditLogQueryDto;
      const { items, total } = await this.queryAuditLogsUseCase.execute(query, {
        userId: req.auth!.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, items, 'Audit logs retrieved', 200, buildPaginationMeta(query.page, query.limit, total));
    } catch (error) {
      next(error);
    }
  };

  activityLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ActivityLogQueryDto;
      const { items, total } = await this.queryActivityLogsUseCase.execute(query);
      sendSuccess(res, items, 'Activity logs retrieved', 200, buildPaginationMeta(query.page, query.limit, total));
    } catch (error) {
      next(error);
    }
  };
}
