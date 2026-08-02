import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { buildPaginationMeta } from '../../../../shared/http/pagination';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { ListBatchQueryDto } from '../../application/dtos/BatchQueryDto';
import { ListBatchesUseCase } from '../../application/use-cases/ListBatchesUseCase';
import { QuarantineBatchUseCase } from '../../application/use-cases/QuarantineBatchUseCase';

export class BatchController {
  constructor(
    private readonly listBatchesUseCase: ListBatchesUseCase,
    private readonly quarantineBatchUseCase: QuarantineBatchUseCase,
  ) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ListBatchQueryDto;
      const { items, total } = await this.listBatchesUseCase.execute(query);
      sendSuccess(res, items, 'Batches retrieved', 200, buildPaginationMeta(query.page, query.limit, total));
    } catch (error) {
      next(error);
    }
  };

  quarantine = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const batch = await this.quarantineBatchUseCase.execute({
        batchId: req.params.batchId,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, batch, 'Batch quarantined');
    } catch (error) {
      next(error);
    }
  };
}
