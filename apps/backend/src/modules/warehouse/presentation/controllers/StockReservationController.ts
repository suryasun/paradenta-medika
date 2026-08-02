import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { CreateStockReservationRequestDto } from '../../application/dtos/StockReservationRequestDto';
import { ReserveStockUseCase } from '../../application/use-cases/ReserveStockUseCase';
import { ReleaseStockReservationUseCase } from '../../application/use-cases/ReleaseStockReservationUseCase';

export class StockReservationController {
  constructor(
    private readonly reserveStockUseCase: ReserveStockUseCase,
    private readonly releaseStockReservationUseCase: ReleaseStockReservationUseCase,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as CreateStockReservationRequestDto;
      const reservation = await this.reserveStockUseCase.execute({
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, reservation, 'Stock reserved', 201);
    } catch (error) {
      next(error);
    }
  };

  release = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const reservation = await this.releaseStockReservationUseCase.execute({
        reservationId: req.params.reservationId,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, reservation, 'Stock reservation released');
    } catch (error) {
      next(error);
    }
  };
}
