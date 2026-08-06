import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { buildPaginationMeta } from '../../../../shared/http/pagination';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { ReservationByStatusReportQueryDto } from '../../application/dtos/ReservationByStatusReportQueryDto';
import { GetReservationByStatusReportUseCase } from '../../application/use-cases/GetReservationByStatusReportUseCase';

/** docs/06-tasks/task-305.md (renamed from CompletedReservationReportController, task-299) */
export class ReservationByStatusReportController {
  constructor(private readonly getReservationByStatusReportUseCase: GetReservationByStatusReportUseCase) {}

  report = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const query = req.query as unknown as ReservationByStatusReportQueryDto;
      const { items, total, summary } = await this.getReservationByStatusReportUseCase.execute(query);
      sendSuccess(res, items, 'Reservation by status report retrieved', 200, {
        ...buildPaginationMeta(query.page, query.limit, total),
        summary,
      });
    } catch (error) {
      next(error);
    }
  };
}
