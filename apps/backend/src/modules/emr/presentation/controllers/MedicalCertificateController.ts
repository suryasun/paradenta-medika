import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { IssueMedicalCertificateRequestDto } from '../../application/dtos/IssueMedicalCertificateRequestDto';
import { IssueMedicalCertificateUseCase } from '../../application/use-cases/IssueMedicalCertificateUseCase';
import { GetMedicalCertificateUseCase } from '../../application/use-cases/GetMedicalCertificateUseCase';
import { ListPatientMedicalCertificatesUseCase } from '../../application/use-cases/ListPatientMedicalCertificatesUseCase';

export class MedicalCertificateController {
  constructor(
    private readonly issueMedicalCertificateUseCase: IssueMedicalCertificateUseCase,
    private readonly getMedicalCertificateUseCase: GetMedicalCertificateUseCase,
    private readonly listPatientMedicalCertificatesUseCase: ListPatientMedicalCertificatesUseCase,
  ) {}

  issue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as IssueMedicalCertificateRequestDto;
      const certificate = await this.issueMedicalCertificateUseCase.execute({
        visitId: req.params.id,
        certificateType: body.certificateType,
        content: body.content,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, certificate, 'Medical certificate issued', 201);
    } catch (error) {
      next(error);
    }
  };

  detail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const certificate = await this.getMedicalCertificateUseCase.execute(req.params.id);
      sendSuccess(res, certificate, 'Medical certificate retrieved');
    } catch (error) {
      next(error);
    }
  };

  listByPatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const certificates = await this.listPatientMedicalCertificatesUseCase.execute(req.params.patientId);
      sendSuccess(res, certificates, 'Medical certificates retrieved');
    } catch (error) {
      next(error);
    }
  };
}
