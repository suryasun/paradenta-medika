import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { CreatePaymentRequestDto } from '../../application/dtos/CreatePaymentRequestDto';
import { CreatePaymentUseCase } from '../../application/use-cases/CreatePaymentUseCase';

export class PaymentController {
  constructor(private readonly createPaymentUseCase: CreatePaymentUseCase) {}

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
}
