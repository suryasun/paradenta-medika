import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { buildPaginationMeta } from '../../../../shared/http/pagination';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { CreatePurchaseOrderRequestDto, RejectPurchaseOrderRequestDto, UpdatePurchaseOrderRequestDto, CancelPurchaseOrderRequestDto } from '../../application/dtos/PurchaseOrderRequestDto';
import { ListPurchaseOrderQueryDto } from '../../application/dtos/PurchaseOrderQueryDto';
import { CreatePurchaseOrderUseCase } from '../../application/use-cases/CreatePurchaseOrderUseCase';
import { ListPurchaseOrdersUseCase } from '../../application/use-cases/ListPurchaseOrdersUseCase';
import { GetPurchaseOrderUseCase } from '../../application/use-cases/GetPurchaseOrderUseCase';
import { UpdatePurchaseOrderUseCase } from '../../application/use-cases/UpdatePurchaseOrderUseCase';
import { SubmitPurchaseOrderUseCase } from '../../application/use-cases/SubmitPurchaseOrderUseCase';
import { ApprovePurchaseOrderUseCase } from '../../application/use-cases/ApprovePurchaseOrderUseCase';
import { RejectPurchaseOrderUseCase } from '../../application/use-cases/RejectPurchaseOrderUseCase';
import { CancelPurchaseOrderUseCase } from '../../application/use-cases/CancelPurchaseOrderUseCase';

export class PurchaseOrderController {
  constructor(
    private readonly createPurchaseOrderUseCase: CreatePurchaseOrderUseCase,
    private readonly listPurchaseOrdersUseCase: ListPurchaseOrdersUseCase,
    private readonly getPurchaseOrderUseCase: GetPurchaseOrderUseCase,
    private readonly updatePurchaseOrderUseCase: UpdatePurchaseOrderUseCase,
    private readonly submitPurchaseOrderUseCase: SubmitPurchaseOrderUseCase,
    private readonly approvePurchaseOrderUseCase: ApprovePurchaseOrderUseCase,
    private readonly rejectPurchaseOrderUseCase: RejectPurchaseOrderUseCase,
    private readonly cancelPurchaseOrderUseCase: CancelPurchaseOrderUseCase,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as CreatePurchaseOrderRequestDto;
      const po = await this.createPurchaseOrderUseCase.execute({
        supplierId: body.supplierId,
        warehouseId: body.warehouseId,
        expectedDate: body.expectedDate,
        items: body.items,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, po, 'Purchase order created', 201);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ListPurchaseOrderQueryDto;
      const { items, total } = await this.listPurchaseOrdersUseCase.execute(query);
      sendSuccess(res, items, 'Purchase orders retrieved', 200, buildPaginationMeta(query.page, query.limit, total));
    } catch (error) {
      next(error);
    }
  };

  detail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const po = await this.getPurchaseOrderUseCase.execute(req.params.purchaseOrderId);
      sendSuccess(res, po, 'Purchase order retrieved');
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as UpdatePurchaseOrderRequestDto;
      const po = await this.updatePurchaseOrderUseCase.execute({
        purchaseOrderId: req.params.purchaseOrderId,
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, po, 'Purchase order updated');
    } catch (error) {
      next(error);
    }
  };

  submit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const po = await this.submitPurchaseOrderUseCase.execute({
        purchaseOrderId: req.params.purchaseOrderId,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, po, 'Purchase order submitted');
    } catch (error) {
      next(error);
    }
  };

  approve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const po = await this.approvePurchaseOrderUseCase.execute({
        purchaseOrderId: req.params.purchaseOrderId,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, po, 'Purchase order approved');
    } catch (error) {
      next(error);
    }
  };

  reject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as RejectPurchaseOrderRequestDto;
      const po = await this.rejectPurchaseOrderUseCase.execute({
        purchaseOrderId: req.params.purchaseOrderId,
        reason: body.reason,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, po, 'Purchase order rejected');
    } catch (error) {
      next(error);
    }
  };

  cancel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as CancelPurchaseOrderRequestDto;
      const po = await this.cancelPurchaseOrderUseCase.execute({
        purchaseOrderId: req.params.purchaseOrderId,
        reason: body.reason,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, po, 'Purchase order cancelled');
    } catch (error) {
      next(error);
    }
  };
}
