import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { OpenVisitRequestDto } from '../../application/dtos/OpenVisitRequestDto';
import { RecordVitalSignRequestDto } from '../../application/dtos/RecordVitalSignRequestDto';
import { RecordSoapNoteRequestDto } from '../../application/dtos/RecordSoapNoteRequestDto';
import { RecordDiagnosisRequestDto } from '../../application/dtos/RecordDiagnosisRequestDto';
import { RecordTreatmentRequestDto } from '../../application/dtos/RecordTreatmentRequestDto';
import { UpdateTreatmentRequestDto } from '../../application/dtos/UpdateTreatmentRequestDto';
import { OpenVisitUseCase } from '../../application/use-cases/OpenVisitUseCase';
import { GetVisitDetailUseCase } from '../../application/use-cases/GetVisitDetailUseCase';
import { RecordVitalSignUseCase } from '../../application/use-cases/RecordVitalSignUseCase';
import { RecordSoapNoteUseCase } from '../../application/use-cases/RecordSoapNoteUseCase';
import { RecordDiagnosisUseCase } from '../../application/use-cases/RecordDiagnosisUseCase';
import { RecordTreatmentUseCase } from '../../application/use-cases/RecordTreatmentUseCase';
import { UpdateTreatmentUseCase } from '../../application/use-cases/UpdateTreatmentUseCase';
import { RemoveTreatmentUseCase } from '../../application/use-cases/RemoveTreatmentUseCase';
import { CloseVisitUseCase } from '../../application/use-cases/CloseVisitUseCase';

export class VisitController {
  constructor(
    private readonly openVisitUseCase: OpenVisitUseCase,
    private readonly getVisitDetailUseCase: GetVisitDetailUseCase,
    private readonly recordVitalSignUseCase: RecordVitalSignUseCase,
    private readonly recordSoapNoteUseCase: RecordSoapNoteUseCase,
    private readonly recordDiagnosisUseCase: RecordDiagnosisUseCase,
    private readonly recordTreatmentUseCase: RecordTreatmentUseCase,
    private readonly updateTreatmentUseCase: UpdateTreatmentUseCase,
    private readonly removeTreatmentUseCase: RemoveTreatmentUseCase,
    private readonly closeVisitUseCase: CloseVisitUseCase,
  ) {}

  open = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as OpenVisitRequestDto;
      const visit = await this.openVisitUseCase.execute({
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, visit, 'Visit opened', 201);
    } catch (error) {
      next(error);
    }
  };

  detail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const visit = await this.getVisitDetailUseCase.execute(req.params.id);
      sendSuccess(res, visit, 'Visit retrieved');
    } catch (error) {
      next(error);
    }
  };

  recordVitalSign = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as RecordVitalSignRequestDto;
      const vitalSign = await this.recordVitalSignUseCase.execute({
        visitId: req.params.id,
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, vitalSign, 'Vital sign recorded', 201);
    } catch (error) {
      next(error);
    }
  };

  recordSoapNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as RecordSoapNoteRequestDto;
      const soapNote = await this.recordSoapNoteUseCase.execute({
        visitId: req.params.id,
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, soapNote, 'SOAP note recorded');
    } catch (error) {
      next(error);
    }
  };

  recordDiagnosis = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as RecordDiagnosisRequestDto;
      const diagnoses = await this.recordDiagnosisUseCase.execute({
        visitId: req.params.id,
        diagnoses: body.diagnoses,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, diagnoses, 'Diagnosis recorded', 201);
    } catch (error) {
      next(error);
    }
  };

  recordTreatment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as RecordTreatmentRequestDto;
      const entry = await this.recordTreatmentUseCase.execute({
        visitId: req.params.id,
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, entry, 'Treatment recorded', 201);
    } catch (error) {
      next(error);
    }
  };

  updateTreatment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as UpdateTreatmentRequestDto;
      const entry = await this.updateTreatmentUseCase.execute({
        visitId: req.params.id,
        visitTreatmentId: req.params.treatmentEntryId,
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, entry, 'Treatment updated');
    } catch (error) {
      next(error);
    }
  };

  removeTreatment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      await this.removeTreatmentUseCase.execute({
        visitId: req.params.id,
        visitTreatmentId: req.params.treatmentEntryId,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, null, 'Treatment removed');
    } catch (error) {
      next(error);
    }
  };

  close = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const visit = await this.closeVisitUseCase.execute({
        visitId: req.params.id,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, visit, 'Visit closed');
    } catch (error) {
      next(error);
    }
  };
}
