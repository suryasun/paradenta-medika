import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { DoctorAvailabilityQueryDto } from '../../application/dtos/DoctorAvailabilityQueryDto';
import { GetDoctorAvailabilityUseCase } from '../../application/use-cases/GetDoctorAvailabilityUseCase';
import { GetDoctorTimeSlotsUseCase } from '../../application/use-cases/GetDoctorTimeSlotsUseCase';

export class DoctorAvailabilityController {
  constructor(
    private readonly getDoctorAvailabilityUseCase: GetDoctorAvailabilityUseCase,
    private readonly getDoctorTimeSlotsUseCase: GetDoctorTimeSlotsUseCase,
  ) {}

  availability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as DoctorAvailabilityQueryDto;
      const result = await this.getDoctorAvailabilityUseCase.execute(req.params.id, query.date);
      sendSuccess(res, result, 'Doctor availability retrieved');
    } catch (error) {
      next(error);
    }
  };

  timeSlots = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as DoctorAvailabilityQueryDto;
      const result = await this.getDoctorTimeSlotsUseCase.execute(req.params.id, query.date);
      sendSuccess(res, result, 'Doctor time slots retrieved');
    } catch (error) {
      next(error);
    }
  };
}
