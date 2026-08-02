import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { buildPaginationMeta } from '../../../../shared/http/pagination';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { CreateItemRequestDto, UpdateItemRequestDto } from '../../application/dtos/ItemRequestDto';
import { CreateItemUseCase } from '../../application/use-cases/CreateItemUseCase';
import { ListItemsUseCase } from '../../application/use-cases/ListItemsUseCase';
import { GetItemUseCase } from '../../application/use-cases/GetItemUseCase';
import { UpdateItemUseCase } from '../../application/use-cases/UpdateItemUseCase';

export class ItemController {
  constructor(
    private readonly createItemUseCase: CreateItemUseCase,
    private readonly listItemsUseCase: ListItemsUseCase,
    private readonly getItemUseCase: GetItemUseCase,
    private readonly updateItemUseCase: UpdateItemUseCase,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as CreateItemRequestDto;
      const item = await this.createItemUseCase.execute({
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, item, 'Item created', 201);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ListQueryDto;
      const { items, total } = await this.listItemsUseCase.execute(query);
      sendSuccess(res, items, 'Items retrieved', 200, buildPaginationMeta(query.page, query.limit, total));
    } catch (error) {
      next(error);
    }
  };

  detail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const item = await this.getItemUseCase.execute(req.params.itemId);
      sendSuccess(res, item, 'Item retrieved');
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as UpdateItemRequestDto;
      const item = await this.updateItemUseCase.execute({
        itemId: req.params.itemId,
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, item, 'Item updated');
    } catch (error) {
      next(error);
    }
  };
}
