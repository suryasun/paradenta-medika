import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { buildPaginationMeta } from '../../../../shared/http/pagination';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { NewPatientReportQueryDto } from '../../application/dtos/NewPatientReportQueryDto';
import { GetNewPatientReportUseCase } from '../../application/use-cases/GetNewPatientReportUseCase';

/** docs/06-tasks/task-291.md */
export class NewPatientReportController {
  constructor(private readonly getNewPatientReportUseCase: GetNewPatientReportUseCase) {}

  report = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const query = req.query as unknown as NewPatientReportQueryDto;
      const { items, total, summary } = await this.getNewPatientReportUseCase.execute(query);
      sendSuccess(res, items, 'New patient report retrieved', 200, { ...buildPaginationMeta(query.page, query.limit, total), summary });
    } catch (error) {
      next(error);
    }
  };
}
