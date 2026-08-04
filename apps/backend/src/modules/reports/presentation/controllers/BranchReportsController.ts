import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { BranchDashboardQueryDto } from '../../application/dtos/BranchDashboardQueryDto';
import { BranchComparisonQueryDto } from '../../application/dtos/BranchComparisonQueryDto';
import { BranchPerformanceQueryDto } from '../../application/dtos/BranchPerformanceQueryDto';
import { GetBranchDashboardUseCase } from '../../application/use-cases/GetBranchDashboardUseCase';
import { GetBranchComparisonReportUseCase } from '../../application/use-cases/GetBranchComparisonReportUseCase';
import { GetBranchPerformanceReportUseCase } from '../../application/use-cases/GetBranchPerformanceReportUseCase';

export class BranchReportsController {
  constructor(
    private readonly getBranchDashboardUseCase: GetBranchDashboardUseCase,
    private readonly getBranchComparisonReportUseCase: GetBranchComparisonReportUseCase,
    private readonly getBranchPerformanceReportUseCase: GetBranchPerformanceReportUseCase,
  ) {}

  dashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const query = req.query as unknown as BranchDashboardQueryDto;
      const result = await this.getBranchDashboardUseCase.execute(query.branchId, req.auth.userId);
      sendSuccess(res, result, 'Branch dashboard retrieved');
    } catch (error) {
      next(error);
    }
  };

  comparison = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const query = req.query as unknown as BranchComparisonQueryDto;
      const branchIds = query.branchIds
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
      const result = await this.getBranchComparisonReportUseCase.execute(branchIds, req.auth.userId);
      sendSuccess(res, result, 'Branch comparison report retrieved');
    } catch (error) {
      next(error);
    }
  };

  performance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const query = req.query as unknown as BranchPerformanceQueryDto;
      const result = await this.getBranchPerformanceReportUseCase.execute(
        query.branchId,
        req.auth.userId,
        query.dateFrom,
        query.dateTo,
      );
      sendSuccess(res, result, 'Branch performance report retrieved');
    } catch (error) {
      next(error);
    }
  };
}
