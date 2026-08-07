import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { buildPaginationMeta } from '../../../../shared/http/pagination';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { GenerateInvoiceRequestDto } from '../../application/dtos/GenerateInvoiceRequestDto';
import { ListInvoiceQueryDto } from '../../application/dtos/ListInvoiceQueryDto';
import { ApplyDiscountRequestDto } from '../../application/dtos/ApplyDiscountRequestDto';
import { AddManualChargeRequestDto } from '../../application/dtos/AddManualChargeRequestDto';
import { CancelInvoiceRequestDto } from '../../application/dtos/CancelInvoiceRequestDto';
import { VoidInvoiceRequestDto } from '../../application/dtos/VoidInvoiceRequestDto';
import { GenerateInvoiceUseCase } from '../../application/use-cases/GenerateInvoiceUseCase';
import { ListInvoicesUseCase } from '../../application/use-cases/ListInvoicesUseCase';
import { GetInvoiceDetailUseCase } from '../../application/use-cases/GetInvoiceDetailUseCase';
import { CloseInvoiceUseCase } from '../../application/use-cases/CloseInvoiceUseCase';
import { ApplyDiscountUseCase } from '../../application/use-cases/ApplyDiscountUseCase';
import { RemoveDiscountUseCase } from '../../application/use-cases/RemoveDiscountUseCase';
import { AddManualChargeUseCase } from '../../application/use-cases/AddManualChargeUseCase';
import { CancelInvoiceUseCase } from '../../application/use-cases/CancelInvoiceUseCase';
import { VoidInvoiceUseCase } from '../../application/use-cases/VoidInvoiceUseCase';

export class InvoiceController {
  constructor(
    private readonly generateInvoiceUseCase: GenerateInvoiceUseCase,
    private readonly listInvoicesUseCase: ListInvoicesUseCase,
    private readonly getInvoiceDetailUseCase: GetInvoiceDetailUseCase,
    private readonly closeInvoiceUseCase: CloseInvoiceUseCase,
    private readonly applyDiscountUseCase: ApplyDiscountUseCase,
    private readonly removeDiscountUseCase: RemoveDiscountUseCase,
    private readonly addManualChargeUseCase: AddManualChargeUseCase,
    private readonly cancelInvoiceUseCase: CancelInvoiceUseCase,
    private readonly voidInvoiceUseCase: VoidInvoiceUseCase,
  ) {}

  generate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as GenerateInvoiceRequestDto;
      const result = await this.generateInvoiceUseCase.execute({
        visitId: body.visitId,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, result, 'Invoice created successfully.', 201);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ListInvoiceQueryDto;
      const { items, total } = await this.listInvoicesUseCase.execute(query);
      sendSuccess(res, items, 'Invoices retrieved', 200, buildPaginationMeta(query.page, query.limit, total));
    } catch (error) {
      next(error);
    }
  };

  detail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const invoice = await this.getInvoiceDetailUseCase.execute(req.params.id);
      sendSuccess(res, invoice, 'Invoice retrieved');
    } catch (error) {
      next(error);
    }
  };

  close = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const invoice = await this.closeInvoiceUseCase.execute({
        invoiceId: req.params.id,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, invoice, 'Invoice closed');
    } catch (error) {
      next(error);
    }
  };

  applyDiscount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as ApplyDiscountRequestDto;
      const invoice = await this.applyDiscountUseCase.execute({
        invoiceId: req.params.id,
        amount: body.amount,
        source: body.source,
        reason: body.reason,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, invoice, 'Discount applied');
    } catch (error) {
      next(error);
    }
  };

  removeDiscount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const invoice = await this.removeDiscountUseCase.execute({
        invoiceId: req.params.id,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, invoice, 'Discount removed');
    } catch (error) {
      next(error);
    }
  };

  addManualCharge = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as AddManualChargeRequestDto;
      const invoice = await this.addManualChargeUseCase.execute({
        invoiceId: req.params.id,
        itemName: body.itemName,
        amount: body.amount,
        reason: body.reason,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, invoice, 'Manual charge added', 201);
    } catch (error) {
      next(error);
    }
  };

  cancel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as CancelInvoiceRequestDto;
      const invoice = await this.cancelInvoiceUseCase.execute({
        invoiceId: req.params.id,
        reason: body.reason,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, invoice, 'Invoice cancelled');
    } catch (error) {
      next(error);
    }
  };

  void = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as VoidInvoiceRequestDto;
      const invoice = await this.voidInvoiceUseCase.execute({
        invoiceId: req.params.id,
        reason: body.reason,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, invoice, 'Invoice voided');
    } catch (error) {
      next(error);
    }
  };
}
