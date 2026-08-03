import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { DashboardQueryDto } from '../../application/dtos/DashboardQueryDto';
import { GetExecutiveDashboardUseCase } from '../../application/use-cases/GetExecutiveDashboardUseCase';
import { GetOperationsDashboardUseCase } from '../../application/use-cases/GetOperationsDashboardUseCase';
import { GetClinicalDashboardUseCase } from '../../application/use-cases/GetClinicalDashboardUseCase';
import { GetFinanceDashboardUseCase } from '../../application/use-cases/GetFinanceDashboardUseCase';
import { GetWarehouseDashboardUseCase } from '../../application/use-cases/GetWarehouseDashboardUseCase';

export class DashboardController {
  constructor(
    private readonly getExecutiveDashboardUseCase: GetExecutiveDashboardUseCase,
    private readonly getOperationsDashboardUseCase: GetOperationsDashboardUseCase,
    private readonly getClinicalDashboardUseCase: GetClinicalDashboardUseCase,
    private readonly getFinanceDashboardUseCase: GetFinanceDashboardUseCase,
    private readonly getWarehouseDashboardUseCase: GetWarehouseDashboardUseCase,
  ) {}

  executive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as DashboardQueryDto;
      const result = await this.getExecutiveDashboardUseCase.execute(query.branchId);
      sendSuccess(res, result, 'Executive dashboard retrieved');
    } catch (error) {
      next(error);
    }
  };

  operations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as DashboardQueryDto;
      const result = await this.getOperationsDashboardUseCase.execute(query.branchId);
      sendSuccess(res, result, 'Operations dashboard retrieved');
    } catch (error) {
      next(error);
    }
  };

  clinical = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as DashboardQueryDto;
      const result = await this.getClinicalDashboardUseCase.execute(query.branchId);
      sendSuccess(res, result, 'Clinical dashboard retrieved');
    } catch (error) {
      next(error);
    }
  };

  finance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as DashboardQueryDto;
      const result = await this.getFinanceDashboardUseCase.execute(query.branchId);
      sendSuccess(res, result, 'Finance dashboard retrieved');
    } catch (error) {
      next(error);
    }
  };

  warehouse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as DashboardQueryDto;
      const result = await this.getWarehouseDashboardUseCase.execute(query.branchId);
      sendSuccess(res, result, 'Warehouse dashboard retrieved');
    } catch (error) {
      next(error);
    }
  };
}
