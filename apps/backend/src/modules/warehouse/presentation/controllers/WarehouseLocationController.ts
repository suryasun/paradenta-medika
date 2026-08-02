import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { buildPaginationMeta } from '../../../../shared/http/pagination';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { CreateWarehouseLocationRequestDto } from '../../application/dtos/WarehouseLocationRequestDto';
import { CreateWarehouseLocationUseCase } from '../../application/use-cases/CreateWarehouseLocationUseCase';
import { ListWarehouseLocationsUseCase } from '../../application/use-cases/ListWarehouseLocationsUseCase';

export class WarehouseLocationController {
  constructor(
    private readonly createWarehouseLocationUseCase: CreateWarehouseLocationUseCase,
    private readonly listWarehouseLocationsUseCase: ListWarehouseLocationsUseCase,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as CreateWarehouseLocationRequestDto;
      const location = await this.createWarehouseLocationUseCase.execute({
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, location, 'Warehouse location created', 201);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ListQueryDto;
      const { items, total } = await this.listWarehouseLocationsUseCase.execute(query);
      sendSuccess(res, items, 'Warehouse locations retrieved', 200, buildPaginationMeta(query.page, query.limit, total));
    } catch (error) {
      next(error);
    }
  };
}
