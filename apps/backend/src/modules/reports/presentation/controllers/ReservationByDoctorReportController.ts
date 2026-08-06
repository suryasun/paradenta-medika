import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { buildPaginationMeta } from '../../../../shared/http/pagination';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { ReservationByDoctorReportQueryDto } from '../../application/dtos/ReservationByDoctorReportQueryDto';
import { GetReservationByDoctorReportUseCase } from '../../application/use-cases/GetReservationByDoctorReportUseCase';

/** docs/06-tasks/task-301.md */
export class ReservationByDoctorReportController {
  constructor(private readonly getReservationByDoctorReportUseCase: GetReservationByDoctorReportUseCase) {}

  report = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const query = req.query as unknown as ReservationByDoctorReportQueryDto;
      const { items, total, summary } = await this.getReservationByDoctorReportUseCase.execute(query);
      sendSuccess(res, items, 'Reservation by doctor report retrieved', 200, {
        ...buildPaginationMeta(query.page, query.limit, total),
        summary,
      });
    } catch (error) {
      next(error);
    }
  };
}
