import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { buildPaginationMeta } from '../../../../shared/http/pagination';
import { StockQueryDto } from '../../application/dtos/StockQueryDto';
import { ListStocksUseCase } from '../../application/use-cases/ListStocksUseCase';
import { GetStockLedgerUseCase } from '../../application/use-cases/GetStockLedgerUseCase';

export class StockController {
  constructor(
    private readonly listStocksUseCase: ListStocksUseCase,
    private readonly getStockLedgerUseCase: GetStockLedgerUseCase,
  ) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as StockQueryDto;
      const { items, total } = await this.listStocksUseCase.execute(query);
      sendSuccess(res, items, 'Stock balances retrieved', 200, buildPaginationMeta(query.page, query.limit, total));
    } catch (error) {
      next(error);
    }
  };

  ledger = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const entries = await this.getStockLedgerUseCase.execute(req.params.stockId);
      sendSuccess(res, entries, 'Stock ledger retrieved');
    } catch (error) {
      next(error);
    }
  };
}
