import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { CreateConsentRequestDto } from '../../application/dtos/CreateConsentRequestDto';
import { SignConsentRequestDto } from '../../application/dtos/SignConsentRequestDto';
import { CreateConsentUseCase } from '../../application/use-cases/CreateConsentUseCase';
import { SignConsentUseCase } from '../../application/use-cases/SignConsentUseCase';
import { GetConsentUseCase } from '../../application/use-cases/GetConsentUseCase';
import { ListPatientConsentsUseCase } from '../../application/use-cases/ListPatientConsentsUseCase';

export class ConsentController {
  constructor(
    private readonly createConsentUseCase: CreateConsentUseCase,
    private readonly signConsentUseCase: SignConsentUseCase,
    private readonly getConsentUseCase: GetConsentUseCase,
    private readonly listPatientConsentsUseCase: ListPatientConsentsUseCase,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as CreateConsentRequestDto;
      const consent = await this.createConsentUseCase.execute({
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, consent, 'Consent created', 201);
    } catch (error) {
      next(error);
    }
  };

  sign = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as SignConsentRequestDto;
      const consent = await this.signConsentUseCase.execute({
        consentId: req.params.id,
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, consent, 'Consent signed');
    } catch (error) {
      next(error);
    }
  };

  detail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const consent = await this.getConsentUseCase.execute(req.params.id);
      sendSuccess(res, consent, 'Consent retrieved');
    } catch (error) {
      next(error);
    }
  };

  listByPatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const consents = await this.listPatientConsentsUseCase.execute(req.params.patientId);
      sendSuccess(res, consents, 'Consents retrieved');
    } catch (error) {
      next(error);
    }
  };
}
