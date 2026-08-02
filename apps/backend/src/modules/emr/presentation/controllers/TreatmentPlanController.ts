import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { CreateTreatmentPlanRequestDto } from '../../application/dtos/CreateTreatmentPlanRequestDto';
import { ConvertTreatmentPlanToReservationRequestDto } from '../../application/dtos/ConvertTreatmentPlanToReservationRequestDto';
import { CreateTreatmentPlanUseCase } from '../../application/use-cases/CreateTreatmentPlanUseCase';
import { GetTreatmentPlanUseCase } from '../../application/use-cases/GetTreatmentPlanUseCase';
import { ConvertTreatmentPlanToReservationUseCase } from '../../application/use-cases/ConvertTreatmentPlanToReservationUseCase';

export class TreatmentPlanController {
  constructor(
    private readonly createTreatmentPlanUseCase: CreateTreatmentPlanUseCase,
    private readonly getTreatmentPlanUseCase: GetTreatmentPlanUseCase,
    private readonly convertTreatmentPlanToReservationUseCase: ConvertTreatmentPlanToReservationUseCase,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as CreateTreatmentPlanRequestDto;
      const items = await this.createTreatmentPlanUseCase.execute({
        visitId: req.params.id,
        items: body.items,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, items, 'Treatment plan created', 201);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const items = await this.getTreatmentPlanUseCase.execute(req.params.id);
      sendSuccess(res, items, 'Treatment plan retrieved');
    } catch (error) {
      next(error);
    }
  };

  convertToReservation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as ConvertTreatmentPlanToReservationRequestDto;
      const reservation = await this.convertTreatmentPlanToReservationUseCase.execute({
        treatmentPlanItemId: req.params.itemId,
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, reservation, 'Reservation created from Treatment Plan item', 201);
    } catch (error) {
      next(error);
    }
  };
}
