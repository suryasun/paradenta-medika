import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { OperationsDashboardQueryDto } from '../../application/dtos/OperationsDashboardQueryDto';
import { OperationsDashboardUseCase } from '../../application/use-cases/OperationsDashboardUseCase';

export class OperationsDashboardController {
  constructor(private readonly operationsDashboardUseCase: OperationsDashboardUseCase) {}

  dashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as OperationsDashboardQueryDto;
      const result = await this.operationsDashboardUseCase.execute(query.branchId);
      sendSuccess(res, result, 'Operations dashboard retrieved');
    } catch (error) {
      next(error);
    }
  };
}
