import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { GenerateDoctorFeeSettlementRequestDto, PayDoctorFeeSettlementRequestDto } from '../../application/dtos/DoctorFeeSettlementRequestDto';
import { GenerateDoctorFeeSettlementUseCase } from '../../application/use-cases/GenerateDoctorFeeSettlementUseCase';
import { ApproveDoctorFeeSettlementUseCase } from '../../application/use-cases/ApproveDoctorFeeSettlementUseCase';
import { PayDoctorFeeSettlementUseCase } from '../../application/use-cases/PayDoctorFeeSettlementUseCase';

export class DoctorFeeSettlementController {
  constructor(
    private readonly generateDoctorFeeSettlementUseCase: GenerateDoctorFeeSettlementUseCase,
    private readonly approveDoctorFeeSettlementUseCase: ApproveDoctorFeeSettlementUseCase,
    private readonly payDoctorFeeSettlementUseCase: PayDoctorFeeSettlementUseCase,
  ) {}

  generate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as GenerateDoctorFeeSettlementRequestDto;
      const settlement = await this.generateDoctorFeeSettlementUseCase.execute({
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, settlement, 'Doctor fee settlement generated', 201);
    } catch (error) {
      next(error);
    }
  };

  approve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const settlement = await this.approveDoctorFeeSettlementUseCase.execute({
        settlementId: req.params.settlementId,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, settlement, 'Doctor fee settlement approved');
    } catch (error) {
      next(error);
    }
  };

  pay = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as PayDoctorFeeSettlementRequestDto;
      const settlement = await this.payDoctorFeeSettlementUseCase.execute({
        settlementId: req.params.settlementId,
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, settlement, 'Doctor fee settlement paid');
    } catch (error) {
      next(error);
    }
  };
}
