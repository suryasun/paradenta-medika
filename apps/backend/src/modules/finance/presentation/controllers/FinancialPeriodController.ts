import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { buildPaginationMeta } from '../../../../shared/http/pagination';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { CreateFinancialPeriodRequestDto } from '../../application/dtos/FinancialPeriodRequestDto';
import { ListFinancialPeriodQueryDto } from '../../application/dtos/FinancialPeriodQueryDto';
import { ReopenFinancialPeriodRequestDto } from '../../application/dtos/FinancialPeriodReopenRequestDto';
import { CreatePeriodUseCase } from '../../application/use-cases/CreatePeriodUseCase';
import { ListPeriodsUseCase } from '../../application/use-cases/ListPeriodsUseCase';
import { LockFinancialPeriodUseCase } from '../../application/use-cases/LockFinancialPeriodUseCase';
import { CloseFinancialPeriodUseCase } from '../../application/use-cases/CloseFinancialPeriodUseCase';
import { ReopenFinancialPeriodUseCase } from '../../application/use-cases/ReopenFinancialPeriodUseCase';

export class FinancialPeriodController {
  constructor(
    private readonly createPeriodUseCase: CreatePeriodUseCase,
    private readonly listPeriodsUseCase: ListPeriodsUseCase,
    private readonly lockFinancialPeriodUseCase: LockFinancialPeriodUseCase,
    private readonly closeFinancialPeriodUseCase: CloseFinancialPeriodUseCase,
    private readonly reopenFinancialPeriodUseCase: ReopenFinancialPeriodUseCase,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as CreateFinancialPeriodRequestDto;
      const period = await this.createPeriodUseCase.execute({
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, period, 'Financial period created', 201);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ListFinancialPeriodQueryDto;
      const { items, total } = await this.listPeriodsUseCase.execute(query);
      sendSuccess(res, items, 'Financial periods retrieved', 200, buildPaginationMeta(query.page, query.limit, total));
    } catch (error) {
      next(error);
    }
  };

  lock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const period = await this.lockFinancialPeriodUseCase.execute({
        periodId: req.params.periodId,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, period, 'Financial period locked');
    } catch (error) {
      next(error);
    }
  };

  close = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const period = await this.closeFinancialPeriodUseCase.execute({
        periodId: req.params.periodId,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, period, 'Financial period closed');
    } catch (error) {
      next(error);
    }
  };

  reopen = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as ReopenFinancialPeriodRequestDto;
      const period = await this.reopenFinancialPeriodUseCase.execute({
        periodId: req.params.periodId,
        reason: body.reason,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, period, 'Financial period reopened');
    } catch (error) {
      next(error);
    }
  };
}
