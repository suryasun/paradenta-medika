import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { buildPaginationMeta } from '../../../../shared/http/pagination';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { CreateCashAccountRequestDto } from '../../application/dtos/CashAccountRequestDto';
import { ListCashAccountQueryDto } from '../../application/dtos/CashAccountQueryDto';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { CreateCashAccountUseCase } from '../../application/use-cases/CreateCashAccountUseCase';
import { ListCashAccountsUseCase } from '../../application/use-cases/ListCashAccountsUseCase';
import { GetCashAccountMovementsUseCase } from '../../application/use-cases/GetCashAccountMovementsUseCase';

export class CashAccountController {
  constructor(
    private readonly createCashAccountUseCase: CreateCashAccountUseCase,
    private readonly listCashAccountsUseCase: ListCashAccountsUseCase,
    private readonly getCashAccountMovementsUseCase: GetCashAccountMovementsUseCase,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as CreateCashAccountRequestDto;
      const cashAccount = await this.createCashAccountUseCase.execute({
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, cashAccount, 'Cash account created', 201);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ListCashAccountQueryDto;
      const { items, total } = await this.listCashAccountsUseCase.execute(query);
      sendSuccess(res, items, 'Cash accounts retrieved', 200, buildPaginationMeta(query.page, query.limit, total));
    } catch (error) {
      next(error);
    }
  };

  movements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ListQueryDto;
      const { items, total } = await this.getCashAccountMovementsUseCase.execute(req.params.cashAccountId, query);
      sendSuccess(res, items, 'Cash account movements retrieved', 200, buildPaginationMeta(query.page, query.limit, total));
    } catch (error) {
      next(error);
    }
  };
}
