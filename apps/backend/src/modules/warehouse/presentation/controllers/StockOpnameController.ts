import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { buildPaginationMeta } from '../../../../shared/http/pagination';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { CreateStockOpnameRequestDto, SubmitStockOpnameRequestDto, UpdateStockOpnameRequestDto } from '../../application/dtos/StockOpnameRequestDto';
import { ListStockOpnameQueryDto } from '../../application/dtos/StockOpnameQueryDto';
import { CreateStockOpnameUseCase } from '../../application/use-cases/CreateStockOpnameUseCase';
import { ListStockOpnamesUseCase } from '../../application/use-cases/ListStockOpnamesUseCase';
import { GetStockOpnameUseCase } from '../../application/use-cases/GetStockOpnameUseCase';
import { UpdateStockOpnameUseCase } from '../../application/use-cases/UpdateStockOpnameUseCase';
import { StartStockOpnameCountUseCase } from '../../application/use-cases/StartStockOpnameCountUseCase';
import { SubmitStockOpnameUseCase } from '../../application/use-cases/SubmitStockOpnameUseCase';
import { ApproveStockOpnameUseCase } from '../../application/use-cases/ApproveStockOpnameUseCase';
import { PostStockOpnameUseCase } from '../../application/use-cases/PostStockOpnameUseCase';

export class StockOpnameController {
  constructor(
    private readonly createStockOpnameUseCase: CreateStockOpnameUseCase,
    private readonly listStockOpnamesUseCase: ListStockOpnamesUseCase,
    private readonly getStockOpnameUseCase: GetStockOpnameUseCase,
    private readonly updateStockOpnameUseCase: UpdateStockOpnameUseCase,
    private readonly startStockOpnameCountUseCase: StartStockOpnameCountUseCase,
    private readonly submitStockOpnameUseCase: SubmitStockOpnameUseCase,
    private readonly approveStockOpnameUseCase: ApproveStockOpnameUseCase,
    private readonly postStockOpnameUseCase: PostStockOpnameUseCase,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as CreateStockOpnameRequestDto;
      const opname = await this.createStockOpnameUseCase.execute({
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, opname, 'Stock opname created', 201);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ListStockOpnameQueryDto;
      const { items, total } = await this.listStockOpnamesUseCase.execute(query);
      sendSuccess(res, items, 'Stock opnames retrieved', 200, buildPaginationMeta(query.page, query.limit, total));
    } catch (error) {
      next(error);
    }
  };

  detail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const opname = await this.getStockOpnameUseCase.execute(req.params.opnameId);
      sendSuccess(res, opname, 'Stock opname retrieved');
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as UpdateStockOpnameRequestDto;
      const opname = await this.updateStockOpnameUseCase.execute({
        opnameId: req.params.opnameId,
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, opname, 'Stock opname updated');
    } catch (error) {
      next(error);
    }
  };

  startCount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const opname = await this.startStockOpnameCountUseCase.execute({
        opnameId: req.params.opnameId,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, opname, 'Stock opname count started');
    } catch (error) {
      next(error);
    }
  };

  submit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as SubmitStockOpnameRequestDto;
      const opname = await this.submitStockOpnameUseCase.execute({
        opnameId: req.params.opnameId,
        items: body.items,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, opname, 'Stock opname submitted');
    } catch (error) {
      next(error);
    }
  };

  approve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const opname = await this.approveStockOpnameUseCase.execute({
        opnameId: req.params.opnameId,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, opname, 'Stock opname approved');
    } catch (error) {
      next(error);
    }
  };

  post = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const opname = await this.postStockOpnameUseCase.execute({
        opnameId: req.params.opnameId,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, opname, 'Stock opname posted');
    } catch (error) {
      next(error);
    }
  };
}
