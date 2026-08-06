import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { buildPaginationMeta } from '../../../../shared/http/pagination';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { ListPatientQueryDto } from '../../application/dtos/ListPatientQueryDto';
import { CreatePatientRequestDto } from '../../application/dtos/CreatePatientRequestDto';
import { UpdatePatientRequestDto } from '../../application/dtos/UpdatePatientRequestDto';
import { CreatePatientUseCase } from '../../application/use-cases/CreatePatientUseCase';
import { ListPatientsUseCase } from '../../application/use-cases/ListPatientsUseCase';
import { GetPatientUseCase } from '../../application/use-cases/GetPatientUseCase';
import { UpdatePatientUseCase } from '../../application/use-cases/UpdatePatientUseCase';
import { ArchivePatientUseCase } from '../../application/use-cases/ArchivePatientUseCase';
import { RestorePatientUseCase } from '../../application/use-cases/RestorePatientUseCase';

export class PatientController {
  constructor(
    private readonly createPatientUseCase: CreatePatientUseCase,
    private readonly listPatientsUseCase: ListPatientsUseCase,
    private readonly getPatientUseCase: GetPatientUseCase,
    private readonly updatePatientUseCase: UpdatePatientUseCase,
    private readonly archivePatientUseCase: ArchivePatientUseCase,
    private readonly restorePatientUseCase: RestorePatientUseCase,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as CreatePatientRequestDto;
      const patient = await this.createPatientUseCase.execute({
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, patient, 'Patient registered', 201);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ListPatientQueryDto;
      const { items, total } = await this.listPatientsUseCase.execute(query);
      sendSuccess(res, items, 'Patients retrieved', 200, buildPaginationMeta(query.page, query.limit, total));
    } catch (error) {
      next(error);
    }
  };

  detail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const patient = await this.getPatientUseCase.execute(req.params.id);
      sendSuccess(res, patient, 'Patient retrieved');
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as UpdatePatientRequestDto;
      const patient = await this.updatePatientUseCase.execute({
        patientId: req.params.id,
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, patient, 'Patient updated');
    } catch (error) {
      next(error);
    }
  };

  archive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const patient = await this.archivePatientUseCase.execute({
        patientId: req.params.id,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, patient, 'Patient archived');
    } catch (error) {
      next(error);
    }
  };

  restore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const patient = await this.restorePatientUseCase.execute({
        patientId: req.params.id,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, patient, 'Patient restored');
    } catch (error) {
      next(error);
    }
  };
}
