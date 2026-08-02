import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { RecordToothConditionRequestDto } from '../../application/dtos/RecordToothConditionRequestDto';
import { RecordToothConditionUseCase } from '../../application/use-cases/RecordToothConditionUseCase';
import { GetCurrentOdontogramUseCase } from '../../application/use-cases/GetCurrentOdontogramUseCase';
import { GetToothHistoryUseCase } from '../../application/use-cases/GetToothHistoryUseCase';

export class OdontogramController {
  constructor(
    private readonly recordToothConditionUseCase: RecordToothConditionUseCase,
    private readonly getCurrentOdontogramUseCase: GetCurrentOdontogramUseCase,
    private readonly getToothHistoryUseCase: GetToothHistoryUseCase,
  ) {}

  record = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as RecordToothConditionRequestDto;
      const entry = await this.recordToothConditionUseCase.execute({
        visitId: req.params.id,
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, entry, 'Tooth condition recorded', 201);
    } catch (error) {
      next(error);
    }
  };

  current = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const entries = await this.getCurrentOdontogramUseCase.execute(req.params.patientId);
      sendSuccess(res, entries, 'Odontogram retrieved');
    } catch (error) {
      next(error);
    }
  };

  history = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const toothNumber = Number(req.params.toothNumber);
      const entries = await this.getToothHistoryUseCase.execute(req.params.patientId, toothNumber);
      sendSuccess(res, entries, 'Tooth history retrieved');
    } catch (error) {
      next(error);
    }
  };
}
