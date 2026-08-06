import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { QueueDashboardQueryDto } from '../../application/dtos/QueueDashboardQueryDto';
import { QueueDashboardUseCase } from '../../application/use-cases/QueueDashboardUseCase';
import { QueueScopeResolver } from './QueueController';

export class QueueDashboardController {
  constructor(
    private readonly queueDashboardUseCase: QueueDashboardUseCase,
    private readonly resolveQueueScope: QueueScopeResolver,
  ) {}

  dashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const query = req.query as unknown as QueueDashboardQueryDto;
      const scope = await this.resolveQueueScope(req.auth.userId, req.auth.roleCodes);
      const result = await this.queueDashboardUseCase.execute(query.branchId, query.date, scope);
      sendSuccess(res, result, 'Queue dashboard retrieved');
    } catch (error) {
      next(error);
    }
  };
}
