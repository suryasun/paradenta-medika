import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { CreateCashTransferRequestDto } from '../../application/dtos/CashTransferRequestDto';
import { CreateCashTransferUseCase } from '../../application/use-cases/CreateCashTransferUseCase';

export class CashTransferController {
  constructor(private readonly createCashTransferUseCase: CreateCashTransferUseCase) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as CreateCashTransferRequestDto;
      const journal = await this.createCashTransferUseCase.execute({
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, journal, 'Cash transfer posted', 201);
    } catch (error) {
      next(error);
    }
  };
}
