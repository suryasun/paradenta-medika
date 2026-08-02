import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { CreateStockAdjustmentRequestDto } from '../../application/dtos/StockAdjustmentRequestDto';
import { CreateStockAdjustmentUseCase } from '../../application/use-cases/CreateStockAdjustmentUseCase';
import { ApproveStockAdjustmentUseCase } from '../../application/use-cases/ApproveStockAdjustmentUseCase';
import { PostStockAdjustmentUseCase } from '../../application/use-cases/PostStockAdjustmentUseCase';

export class StockAdjustmentController {
  constructor(
    private readonly createStockAdjustmentUseCase: CreateStockAdjustmentUseCase,
    private readonly approveStockAdjustmentUseCase: ApproveStockAdjustmentUseCase,
    private readonly postStockAdjustmentUseCase: PostStockAdjustmentUseCase,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as CreateStockAdjustmentRequestDto;
      const adjustment = await this.createStockAdjustmentUseCase.execute({
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, adjustment, 'Stock adjustment created', 201);
    } catch (error) {
      next(error);
    }
  };

  approve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const adjustment = await this.approveStockAdjustmentUseCase.execute({
        adjustmentId: req.params.adjustmentId,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, adjustment, 'Stock adjustment approved');
    } catch (error) {
      next(error);
    }
  };

  post = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const adjustment = await this.postStockAdjustmentUseCase.execute({
        adjustmentId: req.params.adjustmentId,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, adjustment, 'Stock adjustment posted');
    } catch (error) {
      next(error);
    }
  };
}
