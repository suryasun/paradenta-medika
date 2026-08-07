import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { CreatePaymentRequestDto } from '../../application/dtos/CreatePaymentRequestDto';
import { RefundPaymentRequestDto } from '../../application/dtos/RefundPaymentRequestDto';
import { CreatePaymentUseCase } from '../../application/use-cases/CreatePaymentUseCase';
import { RefundPaymentUseCase } from '../../application/use-cases/RefundPaymentUseCase';

export class PaymentController {
  constructor(
    private readonly createPaymentUseCase: CreatePaymentUseCase,
    private readonly refundPaymentUseCase: RefundPaymentUseCase,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as CreatePaymentRequestDto;
      const invoice = await this.createPaymentUseCase.execute({
        invoiceId: body.invoiceId,
        payments: body.payments,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, invoice, 'Payment Success');
    } catch (error) {
      next(error);
    }
  };

  refund = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as RefundPaymentRequestDto;
      const invoice = await this.refundPaymentUseCase.execute({
        paymentId: req.params.id,
        amount: body.amount,
        reason: body.reason,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, invoice, 'Payment refunded');
    } catch (error) {
      next(error);
    }
  };
}
