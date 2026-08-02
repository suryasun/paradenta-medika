import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { CreatePrescriptionRequestDto } from '../../application/dtos/CreatePrescriptionRequestDto';
import { CreatePrescriptionUseCase } from '../../application/use-cases/CreatePrescriptionUseCase';
import { GetPrescriptionHistoryUseCase } from '../../application/use-cases/GetPrescriptionHistoryUseCase';
import { PrintPrescriptionUseCase } from '../../application/use-cases/PrintPrescriptionUseCase';

export class PrescriptionController {
  constructor(
    private readonly createPrescriptionUseCase: CreatePrescriptionUseCase,
    private readonly getPrescriptionHistoryUseCase: GetPrescriptionHistoryUseCase,
    private readonly printPrescriptionUseCase: PrintPrescriptionUseCase,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as CreatePrescriptionRequestDto;
      const prescription = await this.createPrescriptionUseCase.execute({
        visitId: req.params.id,
        items: body.items,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, prescription, 'Prescription created', 201);
    } catch (error) {
      next(error);
    }
  };

  history = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const prescriptions = await this.getPrescriptionHistoryUseCase.execute(req.params.patientId);
      sendSuccess(res, prescriptions, 'Prescription history retrieved');
    } catch (error) {
      next(error);
    }
  };

  print = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const prescription = await this.printPrescriptionUseCase.execute(req.params.id);
      sendSuccess(res, prescription, 'Prescription print data retrieved');
    } catch (error) {
      next(error);
    }
  };
}
