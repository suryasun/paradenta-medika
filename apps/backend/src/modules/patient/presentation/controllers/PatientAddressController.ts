import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { CreatePatientAddressRequestDto, DeletePatientAddressRequestDto, UpdatePatientAddressRequestDto } from '../../application/dtos/PatientAddressRequestDto';
import { AddPatientAddressUseCase } from '../../application/use-cases/AddPatientAddressUseCase';
import { ListPatientAddressesUseCase } from '../../application/use-cases/ListPatientAddressesUseCase';
import { UpdatePatientAddressUseCase } from '../../application/use-cases/UpdatePatientAddressUseCase';
import { DeletePatientAddressUseCase } from '../../application/use-cases/DeletePatientAddressUseCase';
import { SetPrimaryPatientAddressUseCase } from '../../application/use-cases/SetPrimaryPatientAddressUseCase';

export class PatientAddressController {
  constructor(
    private readonly addPatientAddressUseCase: AddPatientAddressUseCase,
    private readonly listPatientAddressesUseCase: ListPatientAddressesUseCase,
    private readonly updatePatientAddressUseCase: UpdatePatientAddressUseCase,
    private readonly deletePatientAddressUseCase: DeletePatientAddressUseCase,
    private readonly setPrimaryPatientAddressUseCase: SetPrimaryPatientAddressUseCase,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as CreatePatientAddressRequestDto;
      const address = await this.addPatientAddressUseCase.execute({
        ...body,
        patientId: req.params.id,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, address, 'Patient address added', 201);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const addresses = await this.listPatientAddressesUseCase.execute(req.params.id);
      sendSuccess(res, addresses, 'Patient addresses retrieved');
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as UpdatePatientAddressRequestDto;
      const address = await this.updatePatientAddressUseCase.execute({
        ...body,
        patientId: req.params.id,
        addressId: req.params.addressId,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, address, 'Patient address updated');
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as DeletePatientAddressRequestDto;
      await this.deletePatientAddressUseCase.execute({
        patientId: req.params.id,
        addressId: req.params.addressId,
        newPrimaryAddressId: body.newPrimaryAddressId,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, null, 'Patient address deleted');
    } catch (error) {
      next(error);
    }
  };

  setPrimary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const address = await this.setPrimaryPatientAddressUseCase.execute({
        patientId: req.params.id,
        addressId: req.params.addressId,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, address, 'Primary address updated');
    } catch (error) {
      next(error);
    }
  };
}
