import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { buildPaginationMeta } from '../../../../shared/http/pagination';
import { StockCardQueryDto, MovementsQueryDto, PurchasesReportQueryDto } from '../../application/dtos/ReportQueryDto';
import { StockQueryDto } from '../../application/dtos/StockQueryDto';
import { ListBatchQueryDto } from '../../application/dtos/BatchQueryDto';
import { ListStockOpnameQueryDto } from '../../application/dtos/StockOpnameQueryDto';
import { GetStockCardReportUseCase } from '../../application/use-cases/GetStockCardReportUseCase';
import { GetStockBalanceReportUseCase } from '../../application/use-cases/GetStockBalanceReportUseCase';
import { GetMovementsReportUseCase } from '../../application/use-cases/GetMovementsReportUseCase';
import { GetPurchasesReportUseCase } from '../../application/use-cases/GetPurchasesReportUseCase';
import { GetExpiryReportUseCase } from '../../application/use-cases/GetExpiryReportUseCase';
import { GetOpnamesReportUseCase } from '../../application/use-cases/GetOpnamesReportUseCase';

export class WarehouseReportController {
  constructor(
    private readonly getStockCardReportUseCase: GetStockCardReportUseCase,
    private readonly getStockBalanceReportUseCase: GetStockBalanceReportUseCase,
    private readonly getMovementsReportUseCase: GetMovementsReportUseCase,
    private readonly getPurchasesReportUseCase: GetPurchasesReportUseCase,
    private readonly getExpiryReportUseCase: GetExpiryReportUseCase,
    private readonly getOpnamesReportUseCase: GetOpnamesReportUseCase,
  ) {}

  stockCard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as StockCardQueryDto;
      const { items, total } = await this.getStockCardReportUseCase.execute(query);
      sendSuccess(res, items, 'Stock card report retrieved', 200, buildPaginationMeta(query.page, query.limit, total));
    } catch (error) {
      next(error);
    }
  };

  stockBalance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as StockQueryDto;
      const { items, total } = await this.getStockBalanceReportUseCase.execute(query);
      sendSuccess(res, items, 'Stock balance report retrieved', 200, buildPaginationMeta(query.page, query.limit, total));
    } catch (error) {
      next(error);
    }
  };

  movements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as MovementsQueryDto;
      const { items, total } = await this.getMovementsReportUseCase.execute(query);
      sendSuccess(res, items, 'Movements report retrieved', 200, buildPaginationMeta(query.page, query.limit, total));
    } catch (error) {
      next(error);
    }
  };

  purchases = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as PurchasesReportQueryDto;
      const { items, total } = await this.getPurchasesReportUseCase.execute(query);
      sendSuccess(res, items, 'Purchases report retrieved', 200, buildPaginationMeta(query.page, query.limit, total));
    } catch (error) {
      next(error);
    }
  };

  expiry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ListBatchQueryDto;
      const { items, total } = await this.getExpiryReportUseCase.execute(query);
      sendSuccess(res, items, 'Expiry report retrieved', 200, buildPaginationMeta(query.page, query.limit, total));
    } catch (error) {
      next(error);
    }
  };

  opnames = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ListStockOpnameQueryDto;
      const { items, total } = await this.getOpnamesReportUseCase.execute(query);
      sendSuccess(res, items, 'Opnames report retrieved', 200, buildPaginationMeta(query.page, query.limit, total));
    } catch (error) {
      next(error);
    }
  };
}
