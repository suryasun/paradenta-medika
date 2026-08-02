import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { CreateStockTransferRequestDto } from '../../application/dtos/StockTransferRequestDto';
import { CreateStockTransferUseCase } from '../../application/use-cases/CreateStockTransferUseCase';
import { SubmitStockTransferUseCase } from '../../application/use-cases/SubmitStockTransferUseCase';
import { ApproveStockTransferUseCase } from '../../application/use-cases/ApproveStockTransferUseCase';
import { DispatchStockTransferUseCase } from '../../application/use-cases/DispatchStockTransferUseCase';
import { ReceiveStockTransferUseCase } from '../../application/use-cases/ReceiveStockTransferUseCase';

export class StockTransferController {
  constructor(
    private readonly createStockTransferUseCase: CreateStockTransferUseCase,
    private readonly submitStockTransferUseCase: SubmitStockTransferUseCase,
    private readonly approveStockTransferUseCase: ApproveStockTransferUseCase,
    private readonly dispatchStockTransferUseCase: DispatchStockTransferUseCase,
    private readonly receiveStockTransferUseCase: ReceiveStockTransferUseCase,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as CreateStockTransferRequestDto;
      const transfer = await this.createStockTransferUseCase.execute({
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, transfer, 'Stock transfer created', 201);
    } catch (error) {
      next(error);
    }
  };

  submit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const transfer = await this.submitStockTransferUseCase.execute({
        transferId: req.params.transferId,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, transfer, 'Stock transfer submitted');
    } catch (error) {
      next(error);
    }
  };

  approve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const transfer = await this.approveStockTransferUseCase.execute({
        transferId: req.params.transferId,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, transfer, 'Stock transfer approved');
    } catch (error) {
      next(error);
    }
  };

  dispatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const transfer = await this.dispatchStockTransferUseCase.execute({
        transferId: req.params.transferId,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, transfer, 'Stock transfer dispatched');
    } catch (error) {
      next(error);
    }
  };

  receive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const transfer = await this.receiveStockTransferUseCase.execute({
        transferId: req.params.transferId,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, transfer, 'Stock transfer received');
    } catch (error) {
      next(error);
    }
  };
}
