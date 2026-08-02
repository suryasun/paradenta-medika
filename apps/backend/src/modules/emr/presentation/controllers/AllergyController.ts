import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { RecordAllergyRequestDto } from '../../application/dtos/RecordAllergyRequestDto';
import { RecordAllergyUseCase } from '../../application/use-cases/RecordAllergyUseCase';
import { GetAllergiesUseCase } from '../../application/use-cases/GetAllergiesUseCase';

export class AllergyController {
  constructor(
    private readonly recordAllergyUseCase: RecordAllergyUseCase,
    private readonly getAllergiesUseCase: GetAllergiesUseCase,
  ) {}

  record = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as RecordAllergyRequestDto;
      const entry = await this.recordAllergyUseCase.execute({
        patientId: req.params.patientId,
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, entry, 'Allergy recorded', 201);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const entries = await this.getAllergiesUseCase.execute(req.params.patientId);
      sendSuccess(res, entries, 'Allergies retrieved');
    } catch (error) {
      next(error);
    }
  };
}
