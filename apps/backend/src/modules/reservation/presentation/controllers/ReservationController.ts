import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { buildPaginationMeta } from '../../../../shared/http/pagination';
import { AuthenticationException, ValidationException } from '../../../../shared/http/exceptions';
import { CreatePatientReservationRequestDto } from '../../application/dtos/CreateReservationRequestDto';
import { UpdateReservationRequestDto } from '../../application/dtos/UpdateReservationRequestDto';
import { RescheduleReservationRequestDto } from '../../application/dtos/RescheduleReservationRequestDto';
import { CancelReservationRequestDto } from '../../application/dtos/CancelReservationRequestDto';
import { ListReservationQueryDto } from '../../application/dtos/ListReservationQueryDto';
import { CreateReservationUseCase } from '../../application/use-cases/CreateReservationUseCase';
import { WalkInRegistrationUseCase } from '../../application/use-cases/WalkInRegistrationUseCase';
import { ListReservationsUseCase } from '../../application/use-cases/ListReservationsUseCase';
import { GetReservationUseCase } from '../../application/use-cases/GetReservationUseCase';
import { UpdateReservationUseCase } from '../../application/use-cases/UpdateReservationUseCase';
import { RescheduleReservationUseCase } from '../../application/use-cases/RescheduleReservationUseCase';
import { CancelReservationUseCase } from '../../application/use-cases/CancelReservationUseCase';
import { CheckInPatientUseCase } from '../../application/use-cases/CheckInPatientUseCase';

export class ReservationController {
  constructor(
    private readonly createReservationUseCase: CreateReservationUseCase,
    private readonly walkInRegistrationUseCase: WalkInRegistrationUseCase,
    private readonly listReservationsUseCase: ListReservationsUseCase,
    private readonly getReservationUseCase: GetReservationUseCase,
    private readonly updateReservationUseCase: UpdateReservationUseCase,
    private readonly rescheduleReservationUseCase: RescheduleReservationUseCase,
    private readonly cancelReservationUseCase: CancelReservationUseCase,
    private readonly checkInPatientUseCase: CheckInPatientUseCase,
  ) {}

  /**
   * docs/06-tasks/task-002.md: a single POST /api/v1/reservations backs
   * both CreateReservationUseCase (scheduled appointment) and
   * WalkInRegistrationUseCase (no date/time supplied, source/type WALK_IN).
   */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as CreatePatientReservationRequestDto;
      const isWalkIn = body.source === 'WALK_IN' || body.reservationType === 'WALK_IN';

      if (isWalkIn) {
        const reservation = await this.walkInRegistrationUseCase.execute({
          patientId: body.patientId,
          doctorId: body.doctorId,
          complaint: body.complaint,
          notes: body.notes,
          actorUserId: req.auth.userId,
          ipAddress: req.ip,
          correlationId: req.correlationId,
        });
        sendSuccess(res, reservation, 'Walk-in reservation created', 201);
        return;
      }

      if (!body.reservationDate || !body.startTime) {
        throw new ValidationException([
          { field: 'reservationDate', message: 'reservationDate and startTime are required for a scheduled reservation' },
        ]);
      }

      const reservation = await this.createReservationUseCase.execute({
        patientId: body.patientId,
        doctorId: body.doctorId,
        reservationDate: body.reservationDate,
        startTime: body.startTime,
        reservationType: body.reservationType,
        source: body.source,
        complaint: body.complaint,
        notes: body.notes,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, reservation, 'Reservation created', 201);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ListReservationQueryDto;
      const { items, total } = await this.listReservationsUseCase.execute(query);
      sendSuccess(res, items, 'Reservations retrieved', 200, buildPaginationMeta(query.page, query.limit, total));
    } catch (error) {
      next(error);
    }
  };

  detail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reservation = await this.getReservationUseCase.execute(req.params.id);
      sendSuccess(res, reservation, 'Reservation retrieved');
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as UpdateReservationRequestDto;
      const reservation = await this.updateReservationUseCase.execute({
        reservationId: req.params.id,
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, reservation, 'Reservation updated');
    } catch (error) {
      next(error);
    }
  };

  reschedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as RescheduleReservationRequestDto;
      const reservation = await this.rescheduleReservationUseCase.execute({
        reservationId: req.params.id,
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, reservation, 'Reservation rescheduled');
    } catch (error) {
      next(error);
    }
  };

  cancel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as CancelReservationRequestDto;
      const reservation = await this.cancelReservationUseCase.execute({
        reservationId: req.params.id,
        reason: body.reason,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, reservation, 'Reservation cancelled');
    } catch (error) {
      next(error);
    }
  };

  checkIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const reservation = await this.checkInPatientUseCase.execute({
        reservationId: req.params.id,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, reservation, 'Patient checked in');
    } catch (error) {
      next(error);
    }
  };
}
