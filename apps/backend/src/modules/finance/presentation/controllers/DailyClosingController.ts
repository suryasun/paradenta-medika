import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { buildPaginationMeta } from '../../../../shared/http/pagination';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { CreateDailyClosingRequestDto } from '../../application/dtos/DailyClosingRequestDto';
import { ListDailyClosingQueryDto } from '../../application/dtos/DailyClosingQueryDto';
import { CreateDailyClosingUseCase } from '../../application/use-cases/CreateDailyClosingUseCase';
import { ApproveDailyClosingUseCase } from '../../application/use-cases/ApproveDailyClosingUseCase';
import { ListDailyClosingsUseCase } from '../../application/use-cases/ListDailyClosingsUseCase';

export class DailyClosingController {
  constructor(
    private readonly createDailyClosingUseCase: CreateDailyClosingUseCase,
    private readonly approveDailyClosingUseCase: ApproveDailyClosingUseCase,
    private readonly listDailyClosingsUseCase: ListDailyClosingsUseCase,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as CreateDailyClosingRequestDto;
      const closing = await this.createDailyClosingUseCase.execute({
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, closing, 'Daily closing created', 201);
    } catch (error) {
      next(error);
    }
  };

  approve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const closing = await this.approveDailyClosingUseCase.execute({
        closingId: req.params.closingId,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, closing, 'Daily closing approved');
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ListDailyClosingQueryDto;
      const { items, total } = await this.listDailyClosingsUseCase.execute(query);
      sendSuccess(res, items, 'Daily closings retrieved', 200, buildPaginationMeta(query.page, query.limit, total));
    } catch (error) {
      next(error);
    }
  };
}
