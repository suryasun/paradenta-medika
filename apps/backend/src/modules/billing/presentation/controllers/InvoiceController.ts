import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { buildPaginationMeta } from '../../../../shared/http/pagination';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { GenerateInvoiceRequestDto } from '../../application/dtos/GenerateInvoiceRequestDto';
import { ListInvoiceQueryDto } from '../../application/dtos/ListInvoiceQueryDto';
import { GenerateInvoiceUseCase } from '../../application/use-cases/GenerateInvoiceUseCase';
import { ListInvoicesUseCase } from '../../application/use-cases/ListInvoicesUseCase';
import { GetInvoiceDetailUseCase } from '../../application/use-cases/GetInvoiceDetailUseCase';
import { CloseInvoiceUseCase } from '../../application/use-cases/CloseInvoiceUseCase';

export class InvoiceController {
  constructor(
    private readonly generateInvoiceUseCase: GenerateInvoiceUseCase,
    private readonly listInvoicesUseCase: ListInvoicesUseCase,
    private readonly getInvoiceDetailUseCase: GetInvoiceDetailUseCase,
    private readonly closeInvoiceUseCase: CloseInvoiceUseCase,
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
}
