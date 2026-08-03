import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { buildPaginationMeta } from '../../../../shared/http/pagination';
import { ListBackgroundJobsUseCase, ListBackgroundJobQuery } from '../../application/use-cases/ListBackgroundJobsUseCase';
import { GetBackgroundJobUseCase } from '../../application/use-cases/GetBackgroundJobUseCase';
import { RetryBackgroundJobUseCase } from '../../application/use-cases/RetryBackgroundJobUseCase';
import { CancelBackgroundJobUseCase } from '../../application/use-cases/CancelBackgroundJobUseCase';
import { GetOperationsHealthUseCase } from '../../application/use-cases/GetOperationsHealthUseCase';

export class BackgroundJobController {
  constructor(
    private readonly listBackgroundJobsUseCase: ListBackgroundJobsUseCase,
    private readonly getBackgroundJobUseCase: GetBackgroundJobUseCase,
    private readonly retryBackgroundJobUseCase: RetryBackgroundJobUseCase,
    private readonly cancelBackgroundJobUseCase: CancelBackgroundJobUseCase,
    private readonly getOperationsHealthUseCase: GetOperationsHealthUseCase,
  ) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ListBackgroundJobQuery;
      const { items, total } = await this.listBackgroundJobsUseCase.execute(query);
      sendSuccess(res, items, 'Background jobs retrieved', 200, buildPaginationMeta(query.page, query.limit, total));
    } catch (error) {
      next(error);
    }
  };

  detail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const job = await this.getBackgroundJobUseCase.execute(req.params.jobId);
      sendSuccess(res, job, 'Background job retrieved');
    } catch (error) {
      next(error);
    }
  };

  retry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const job = await this.retryBackgroundJobUseCase.execute(req.params.jobId, {
        userId: req.auth!.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, job, 'Background job retried');
    } catch (error) {
      next(error);
    }
  };

  cancel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const job = await this.cancelBackgroundJobUseCase.execute(req.params.jobId, {
        userId: req.auth!.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, job, 'Background job cancellation processed');
    } catch (error) {
      next(error);
    }
  };

  operationsHealth = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.getOperationsHealthUseCase.execute();
      sendSuccess(res, result, 'Operations health retrieved');
    } catch (error) {
      next(error);
    }
  };
}
