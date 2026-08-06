import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { buildPaginationMeta } from '../../../../shared/http/pagination';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { CompletedReservationReportQueryDto } from '../../application/dtos/CompletedReservationReportQueryDto';
import { GetCompletedReservationReportUseCase } from '../../application/use-cases/GetCompletedReservationReportUseCase';

/** docs/06-tasks/task-299.md */
export class CompletedReservationReportController {
  constructor(private readonly getCompletedReservationReportUseCase: GetCompletedReservationReportUseCase) {}

  report = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const query = req.query as unknown as CompletedReservationReportQueryDto;
      const { items, total, summary } = await this.getCompletedReservationReportUseCase.execute(query);
      sendSuccess(res, items, 'Completed reservation report retrieved', 200, {
        ...buildPaginationMeta(query.page, query.limit, total),
        summary,
      });
    } catch (error) {
      next(error);
    }
  };
}
