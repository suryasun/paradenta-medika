import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { buildPaginationMeta } from '../../../../shared/http/pagination';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { CreateFinancialPeriodRequestDto } from '../../application/dtos/FinancialPeriodRequestDto';
import { ListFinancialPeriodQueryDto } from '../../application/dtos/FinancialPeriodQueryDto';
import { CreatePeriodUseCase } from '../../application/use-cases/CreatePeriodUseCase';
import { ListPeriodsUseCase } from '../../application/use-cases/ListPeriodsUseCase';

export class FinancialPeriodController {
  constructor(
    private readonly createPeriodUseCase: CreatePeriodUseCase,
    private readonly listPeriodsUseCase: ListPeriodsUseCase,
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
}
