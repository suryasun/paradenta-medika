import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { RecordMedicalHistoryRequestDto } from '../../application/dtos/RecordMedicalHistoryRequestDto';
import { RecordMedicalHistoryUseCase } from '../../application/use-cases/RecordMedicalHistoryUseCase';
import { GetMedicalHistoryUseCase } from '../../application/use-cases/GetMedicalHistoryUseCase';

export class MedicalHistoryController {
  constructor(
    private readonly recordMedicalHistoryUseCase: RecordMedicalHistoryUseCase,
    private readonly getMedicalHistoryUseCase: GetMedicalHistoryUseCase,
  ) {}

  record = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as RecordMedicalHistoryRequestDto;
      const entry = await this.recordMedicalHistoryUseCase.execute({
        patientId: req.params.patientId,
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, entry, 'Medical history recorded', 201);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const entries = await this.getMedicalHistoryUseCase.execute(req.params.patientId);
      sendSuccess(res, entries, 'Medical history retrieved');
    } catch (error) {
      next(error);
    }
  };
}
