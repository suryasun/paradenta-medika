import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { buildPaginationMeta } from '../../../../shared/http/pagination';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { CreateStockTransferRequestDto } from '../../application/dtos/StockTransferRequestDto';
import { ListStockTransferQueryDto } from '../../application/dtos/StockTransferQueryDto';
import { CreateStockTransferUseCase } from '../../application/use-cases/CreateStockTransferUseCase';
import { SubmitStockTransferUseCase } from '../../application/use-cases/SubmitStockTransferUseCase';
import { ApproveStockTransferUseCase } from '../../application/use-cases/ApproveStockTransferUseCase';
import { DispatchStockTransferUseCase } from '../../application/use-cases/DispatchStockTransferUseCase';
import { ReceiveStockTransferUseCase } from '../../application/use-cases/ReceiveStockTransferUseCase';
import { ListStockTransferUseCase } from '../../application/use-cases/ListStockTransferUseCase';
import { GetStockTransferUseCase } from '../../application/use-cases/GetStockTransferUseCase';

export class StockTransferController {
  constructor(
    private readonly createStockTransferUseCase: CreateStockTransferUseCase,
    private readonly submitStockTransferUseCase: SubmitStockTransferUseCase,
    private readonly approveStockTransferUseCase: ApproveStockTransferUseCase,
    private readonly dispatchStockTransferUseCase: DispatchStockTransferUseCase,
    private readonly receiveStockTransferUseCase: ReceiveStockTransferUseCase,
    private readonly listStockTransferUseCase: ListStockTransferUseCase,
    private readonly getStockTransferUseCase: GetStockTransferUseCase,
  ) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ListStockTransferQueryDto;
      const { items, total } = await this.listStockTransferUseCase.execute(query);
      sendSuccess(res, items, 'Stock transfers retrieved', 200, buildPaginationMeta(query.page, query.limit, total));
    } catch (error) {
      next(error);
    }
  };

  detail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const transfer = await this.getStockTransferUseCase.execute(req.params.transferId);
      sendSuccess(res, transfer, 'Stock transfer retrieved');
    } catch (error) {
      next(error);
    }
  };

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
