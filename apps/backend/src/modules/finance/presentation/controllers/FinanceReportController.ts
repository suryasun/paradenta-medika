import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { buildPaginationMeta } from '../../../../shared/http/pagination';
import {
  CashFlowQueryDto,
  DailyClosingReportQueryDto,
  ExpensesReportQueryDto,
  GeneralLedgerQueryDto,
  IncomeStatementQueryDto,
  TrialBalanceQueryDto,
} from '../../application/dtos/ReportQueryDto';
import { GetTrialBalanceReportUseCase } from '../../application/use-cases/GetTrialBalanceReportUseCase';
import { GetGeneralLedgerReportUseCase } from '../../application/use-cases/GetGeneralLedgerReportUseCase';
import { GetIncomeStatementReportUseCase } from '../../application/use-cases/GetIncomeStatementReportUseCase';
import { GetCashFlowReportUseCase } from '../../application/use-cases/GetCashFlowReportUseCase';
import { GetExpensesReportUseCase } from '../../application/use-cases/GetExpensesReportUseCase';
import { GetDailyClosingReportUseCase } from '../../application/use-cases/GetDailyClosingReportUseCase';

export class FinanceReportController {
  constructor(
    private readonly getTrialBalanceReportUseCase: GetTrialBalanceReportUseCase,
    private readonly getGeneralLedgerReportUseCase: GetGeneralLedgerReportUseCase,
    private readonly getIncomeStatementReportUseCase: GetIncomeStatementReportUseCase,
    private readonly getCashFlowReportUseCase: GetCashFlowReportUseCase,
    private readonly getExpensesReportUseCase: GetExpensesReportUseCase,
    private readonly getDailyClosingReportUseCase: GetDailyClosingReportUseCase,
  ) {}

  trialBalance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as TrialBalanceQueryDto;
      const rows = await this.getTrialBalanceReportUseCase.execute(query);
      sendSuccess(res, rows, 'Trial balance report retrieved');
    } catch (error) {
      next(error);
    }
  };

  generalLedger = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as GeneralLedgerQueryDto;
      const { items, total } = await this.getGeneralLedgerReportUseCase.execute(query);
      sendSuccess(res, items, 'General ledger report retrieved', 200, buildPaginationMeta(query.page, query.limit, total));
    } catch (error) {
      next(error);
    }
  };

  incomeStatement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as IncomeStatementQueryDto;
      const result = await this.getIncomeStatementReportUseCase.execute(query);
      sendSuccess(res, result, 'Income statement report retrieved');
    } catch (error) {
      next(error);
    }
  };

  cashFlow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as CashFlowQueryDto;
      const rows = await this.getCashFlowReportUseCase.execute(query);
      sendSuccess(res, rows, 'Cash flow report retrieved');
    } catch (error) {
      next(error);
    }
  };

  expenses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ExpensesReportQueryDto;
      const { items, total } = await this.getExpensesReportUseCase.execute(query);
      sendSuccess(res, items, 'Expenses report retrieved', 200, buildPaginationMeta(query.page, query.limit, total));
    } catch (error) {
      next(error);
    }
  };

  dailyClosing = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as DailyClosingReportQueryDto;
      const { items, total } = await this.getDailyClosingReportUseCase.execute(query);
      sendSuccess(res, items, 'Daily closing report retrieved', 200, buildPaginationMeta(query.page, query.limit, total));
    } catch (error) {
      next(error);
    }
  };
}
