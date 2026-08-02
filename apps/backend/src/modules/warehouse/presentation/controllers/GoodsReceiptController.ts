import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { CreateGoodsReceiptRequestDto } from '../../application/dtos/GoodsReceiptRequestDto';
import { CreateGoodsReceiptUseCase } from '../../application/use-cases/CreateGoodsReceiptUseCase';
import { GetGoodsReceiptUseCase } from '../../application/use-cases/GetGoodsReceiptUseCase';
import { PostGoodsReceiptUseCase } from '../../application/use-cases/PostGoodsReceiptUseCase';

export class GoodsReceiptController {
  constructor(
    private readonly createGoodsReceiptUseCase: CreateGoodsReceiptUseCase,
    private readonly getGoodsReceiptUseCase: GetGoodsReceiptUseCase,
    private readonly postGoodsReceiptUseCase: PostGoodsReceiptUseCase,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as CreateGoodsReceiptRequestDto;
      const receipt = await this.createGoodsReceiptUseCase.execute({
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, receipt, 'Goods receipt created', 201);
    } catch (error) {
      next(error);
    }
  };

  detail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const receipt = await this.getGoodsReceiptUseCase.execute(req.params.goodsReceiptId);
      sendSuccess(res, receipt, 'Goods receipt retrieved');
    } catch (error) {
      next(error);
    }
  };

  post = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const receipt = await this.postGoodsReceiptUseCase.execute({
        goodsReceiptId: req.params.goodsReceiptId,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, receipt, 'Goods receipt posted');
    } catch (error) {
      next(error);
    }
  };
}
