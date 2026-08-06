import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { ListReportDefinitionsUseCase } from '../../application/use-cases/ListReportDefinitionsUseCase';
import { GetReportUseCase, ReportQueryParams } from '../../application/use-cases/GetReportUseCase';
import { ReportCatalogQueryDto } from '../../application/dtos/ReportCatalogQueryDto';

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
      if (!req.auth) throw new AuthenticationException();
      const dtoQuery = req.query as unknown as ReportCatalogQueryDto;
      const query: ReportQueryParams = {
        ...(req.query as unknown as ReportQueryParams),
        // Phase 4 hardening: branch.comparison's only multi-branch filter --
        // comma-separated on the wire (same convention as
        // BranchComparisonQueryDto), parsed to an array here.
        branchIds: dtoQuery.branchIds
          ? dtoQuery.branchIds.split(',').map((id) => id.trim()).filter(Boolean)
          : undefined,
      };
      const result = await this.getReportUseCase.execute(req.params.reportCode, query, req.auth.permissionKeys, req.auth.userId);
      sendSuccess(res, result, 'Report retrieved');
    } catch (error) {
      next(error);
    }
  };
}
