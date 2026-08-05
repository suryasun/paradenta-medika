import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import {
  CreatePatientEmergencyContactRequestDto,
  UpdatePatientEmergencyContactRequestDto,
} from '../../application/dtos/PatientEmergencyContactRequestDto';
import { AddEmergencyContactUseCase } from '../../application/use-cases/AddEmergencyContactUseCase';
import { ListEmergencyContactsUseCase } from '../../application/use-cases/ListEmergencyContactsUseCase';
import { UpdateEmergencyContactUseCase } from '../../application/use-cases/UpdateEmergencyContactUseCase';
import { DeleteEmergencyContactUseCase } from '../../application/use-cases/DeleteEmergencyContactUseCase';

export class PatientEmergencyContactController {
  constructor(
    private readonly addEmergencyContactUseCase: AddEmergencyContactUseCase,
    private readonly listEmergencyContactsUseCase: ListEmergencyContactsUseCase,
    private readonly updateEmergencyContactUseCase: UpdateEmergencyContactUseCase,
    private readonly deleteEmergencyContactUseCase: DeleteEmergencyContactUseCase,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as CreatePatientEmergencyContactRequestDto;
      const contact = await this.addEmergencyContactUseCase.execute({
        ...body,
        patientId: req.params.id,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, contact, 'Emergency contact added', 201);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const contacts = await this.listEmergencyContactsUseCase.execute(req.params.id);
      sendSuccess(res, contacts, 'Emergency contacts retrieved');
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as UpdatePatientEmergencyContactRequestDto;
      const contact = await this.updateEmergencyContactUseCase.execute({
        ...body,
        patientId: req.params.id,
        contactId: req.params.contactId,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, contact, 'Emergency contact updated');
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      await this.deleteEmergencyContactUseCase.execute({
        patientId: req.params.id,
        contactId: req.params.contactId,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, null, 'Emergency contact deleted');
    } catch (error) {
      next(error);
    }
  };
}
