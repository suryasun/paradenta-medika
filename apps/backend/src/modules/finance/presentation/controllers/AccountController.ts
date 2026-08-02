import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { buildPaginationMeta } from '../../../../shared/http/pagination';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { CreateAccountRequestDto, UpdateAccountRequestDto } from '../../application/dtos/AccountRequestDto';
import { ListAccountQueryDto } from '../../application/dtos/AccountQueryDto';
import { CreateAccountUseCase } from '../../application/use-cases/CreateAccountUseCase';
import { ListAccountsUseCase } from '../../application/use-cases/ListAccountsUseCase';
import { UpdateAccountUseCase } from '../../application/use-cases/UpdateAccountUseCase';
import { DeactivateAccountUseCase } from '../../application/use-cases/DeactivateAccountUseCase';

export class AccountController {
  constructor(
    private readonly createAccountUseCase: CreateAccountUseCase,
    private readonly listAccountsUseCase: ListAccountsUseCase,
    private readonly updateAccountUseCase: UpdateAccountUseCase,
    private readonly deactivateAccountUseCase: DeactivateAccountUseCase,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as CreateAccountRequestDto;
      const account = await this.createAccountUseCase.execute({
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, account, 'Account created', 201);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ListAccountQueryDto;
      const { items, total } = await this.listAccountsUseCase.execute(query);
      sendSuccess(res, items, 'Accounts retrieved', 200, buildPaginationMeta(query.page, query.limit, total));
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as UpdateAccountRequestDto;
      const account = await this.updateAccountUseCase.execute({
        accountId: req.params.accountId,
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, account, 'Account updated');
    } catch (error) {
      next(error);
    }
  };

  deactivate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const account = await this.deactivateAccountUseCase.execute({
        accountId: req.params.accountId,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, account, 'Account deactivated');
    } catch (error) {
      next(error);
    }
  };
}
