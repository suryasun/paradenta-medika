import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { ListReportDefinitionsUseCase } from '../../application/use-cases/ListReportDefinitionsUseCase';
import { GetReportUseCase, ReportQueryParams } from '../../application/use-cases/GetReportUseCase';

export class ReportCatalogController {
  constructor(
    private readonly listReportDefinitionsUseCase: ListReportDefinitionsUseCase,
    private readonly getReportUseCase: GetReportUseCase,
  ) {}

  definitions = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = this.listReportDefinitionsUseCase.execute(req.auth!.permissionKeys);
      sendSuccess(res, result, 'Report catalog retrieved');
    } catch (error) {
      next(error);
    }
  };

  getReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ReportQueryParams;
      const result = await this.getReportUseCase.execute(req.params.reportCode, query, req.auth!.permissionKeys);
      sendSuccess(res, result, 'Report retrieved');
    } catch (error) {
      next(error);
    }
  };
}
