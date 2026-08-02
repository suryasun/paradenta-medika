import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { CreatePeriodontalAssessmentRequestDto } from '../../application/dtos/CreatePeriodontalAssessmentRequestDto';
import { SaveMeasurementRequestDto } from '../../application/dtos/SaveMeasurementRequestDto';
import { UpdateMeasurementRequestDto } from '../../application/dtos/UpdateMeasurementRequestDto';
import { CreatePeriodontalAssessmentUseCase } from '../../application/use-cases/CreatePeriodontalAssessmentUseCase';
import { AddPeriodontalMeasurementUseCase } from '../../application/use-cases/AddPeriodontalMeasurementUseCase';
import { UpdatePeriodontalMeasurementUseCase } from '../../application/use-cases/UpdatePeriodontalMeasurementUseCase';
import { DeletePeriodontalMeasurementUseCase } from '../../application/use-cases/DeletePeriodontalMeasurementUseCase';
import { GetPeriodontalAssessmentUseCase } from '../../application/use-cases/GetPeriodontalAssessmentUseCase';
import { GetPeriodontalAssessmentHistoryUseCase } from '../../application/use-cases/GetPeriodontalAssessmentHistoryUseCase';
import { LockPeriodontalAssessmentUseCase } from '../../application/use-cases/LockPeriodontalAssessmentUseCase';

export class PeriodontalAssessmentController {
  constructor(
    private readonly createAssessmentUseCase: CreatePeriodontalAssessmentUseCase,
    private readonly addMeasurementUseCase: AddPeriodontalMeasurementUseCase,
    private readonly updateMeasurementUseCase: UpdatePeriodontalMeasurementUseCase,
    private readonly deleteMeasurementUseCase: DeletePeriodontalMeasurementUseCase,
    private readonly getAssessmentUseCase: GetPeriodontalAssessmentUseCase,
    private readonly getAssessmentHistoryUseCase: GetPeriodontalAssessmentHistoryUseCase,
    private readonly lockAssessmentUseCase: LockPeriodontalAssessmentUseCase,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as CreatePeriodontalAssessmentRequestDto;
      const assessment = await this.createAssessmentUseCase.execute({
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, assessment, 'Assessment created', 201);
    } catch (error) {
      next(error);
    }
  };

  addMeasurement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as SaveMeasurementRequestDto;
      const measurement = await this.addMeasurementUseCase.execute({
        assessmentId: req.params.assessmentId,
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, measurement, 'Measurement saved', 201);
    } catch (error) {
      next(error);
    }
  };

  updateMeasurement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as UpdateMeasurementRequestDto;
      const measurement = await this.updateMeasurementUseCase.execute({
        assessmentId: req.params.assessmentId,
        measurementId: req.params.id,
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, measurement, 'Measurement updated');
    } catch (error) {
      next(error);
    }
  };

  deleteMeasurement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      await this.deleteMeasurementUseCase.execute({
        assessmentId: req.params.assessmentId,
        measurementId: req.params.id,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, null, 'Measurement deleted');
    } catch (error) {
      next(error);
    }
  };

  detail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const assessment = await this.getAssessmentUseCase.execute(req.params.assessmentId);
      sendSuccess(res, assessment, 'Assessment retrieved');
    } catch (error) {
      next(error);
    }
  };

  history = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const history = await this.getAssessmentHistoryUseCase.execute(req.params.assessmentId);
      sendSuccess(res, history, 'Assessment history retrieved');
    } catch (error) {
      next(error);
    }
  };

  lock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const assessment = await this.lockAssessmentUseCase.execute({
        assessmentId: req.params.assessmentId,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, assessment, 'Assessment locked');
    } catch (error) {
      next(error);
    }
  };
}
