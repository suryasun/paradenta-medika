import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { buildPaginationMeta } from '../../../../shared/http/pagination';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import {
  CreateExpenseRequestDto,
  PayExpenseRequestDto,
  RejectExpenseRequestDto,
  UpdateExpenseRequestDto,
} from '../../application/dtos/ExpenseRequestDto';
import { ListExpenseQueryDto } from '../../application/dtos/ExpenseQueryDto';
import { CreateExpenseUseCase } from '../../application/use-cases/CreateExpenseUseCase';
import { ListExpensesUseCase } from '../../application/use-cases/ListExpensesUseCase';
import { GetExpenseUseCase } from '../../application/use-cases/GetExpenseUseCase';
import { UpdateExpenseUseCase } from '../../application/use-cases/UpdateExpenseUseCase';
import { SubmitExpenseUseCase } from '../../application/use-cases/SubmitExpenseUseCase';
import { ApproveExpenseUseCase } from '../../application/use-cases/ApproveExpenseUseCase';
import { RejectExpenseUseCase } from '../../application/use-cases/RejectExpenseUseCase';
import { PayExpenseUseCase } from '../../application/use-cases/PayExpenseUseCase';

export class ExpenseController {
  constructor(
    private readonly createExpenseUseCase: CreateExpenseUseCase,
    private readonly listExpensesUseCase: ListExpensesUseCase,
    private readonly getExpenseUseCase: GetExpenseUseCase,
    private readonly updateExpenseUseCase: UpdateExpenseUseCase,
    private readonly submitExpenseUseCase: SubmitExpenseUseCase,
    private readonly approveExpenseUseCase: ApproveExpenseUseCase,
    private readonly rejectExpenseUseCase: RejectExpenseUseCase,
    private readonly payExpenseUseCase: PayExpenseUseCase,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as CreateExpenseRequestDto;
      const expense = await this.createExpenseUseCase.execute({
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, expense, 'Expense created', 201);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ListExpenseQueryDto;
      const { items, total } = await this.listExpensesUseCase.execute(query);
      sendSuccess(res, items, 'Expenses retrieved', 200, buildPaginationMeta(query.page, query.limit, total));
    } catch (error) {
      next(error);
    }
  };

  detail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const expense = await this.getExpenseUseCase.execute(req.params.expenseId);
      sendSuccess(res, expense, 'Expense retrieved');
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as UpdateExpenseRequestDto;
      const expense = await this.updateExpenseUseCase.execute({
        expenseId: req.params.expenseId,
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, expense, 'Expense updated');
    } catch (error) {
      next(error);
    }
  };

  submit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const expense = await this.submitExpenseUseCase.execute({
        expenseId: req.params.expenseId,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, expense, 'Expense submitted');
    } catch (error) {
      next(error);
    }
  };

  approve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const expense = await this.approveExpenseUseCase.execute({
        expenseId: req.params.expenseId,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, expense, 'Expense approved');
    } catch (error) {
      next(error);
    }
  };

  reject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as RejectExpenseRequestDto;
      const expense = await this.rejectExpenseUseCase.execute({
        expenseId: req.params.expenseId,
        reason: body.reason,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, expense, 'Expense rejected');
    } catch (error) {
      next(error);
    }
  };

  pay = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as PayExpenseRequestDto;
      const expense = await this.payExpenseUseCase.execute({
        expenseId: req.params.expenseId,
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, expense, 'Expense paid');
    } catch (error) {
      next(error);
    }
  };
}
