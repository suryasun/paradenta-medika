import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { QueueDashboardQueryDto } from '../../application/dtos/QueueDashboardQueryDto';
import { QueueDashboardUseCase } from '../../application/use-cases/QueueDashboardUseCase';

export class QueueDashboardController {
  constructor(private readonly queueDashboardUseCase: QueueDashboardUseCase) {}

  dashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as QueueDashboardQueryDto;
      const result = await this.queueDashboardUseCase.execute(query.branchId, query.date);
      sendSuccess(res, result, 'Queue dashboard retrieved');
    } catch (error) {
      next(error);
    }
  };
}
