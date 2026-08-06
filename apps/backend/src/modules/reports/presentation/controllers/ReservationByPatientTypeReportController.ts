import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { buildPaginationMeta } from '../../../../shared/http/pagination';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { ReservationByPatientTypeReportQueryDto } from '../../application/dtos/ReservationByPatientTypeReportQueryDto';
import { GetReservationByPatientTypeReportUseCase } from '../../application/use-cases/GetReservationByPatientTypeReportUseCase';

/** docs/06-tasks/task-300.md */
export class ReservationByPatientTypeReportController {
  constructor(private readonly getReservationByPatientTypeReportUseCase: GetReservationByPatientTypeReportUseCase) {}

  report = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const query = req.query as unknown as ReservationByPatientTypeReportQueryDto;
      const { items, total, summary } = await this.getReservationByPatientTypeReportUseCase.execute(query);
      sendSuccess(res, items, 'Reservation by patient type report retrieved', 200, {
        ...buildPaginationMeta(query.page, query.limit, total),
        summary,
      });
    } catch (error) {
      next(error);
    }
  };
}
