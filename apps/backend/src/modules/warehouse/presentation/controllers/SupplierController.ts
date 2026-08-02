import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { buildPaginationMeta } from '../../../../shared/http/pagination';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { CreateSupplierRequestDto } from '../../application/dtos/SupplierRequestDto';
import { CreateSupplierUseCase } from '../../application/use-cases/CreateSupplierUseCase';
import { ListSuppliersUseCase } from '../../application/use-cases/ListSuppliersUseCase';

export class SupplierController {
  constructor(
    private readonly createSupplierUseCase: CreateSupplierUseCase,
    private readonly listSuppliersUseCase: ListSuppliersUseCase,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as CreateSupplierRequestDto;
      const supplier = await this.createSupplierUseCase.execute({
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, supplier, 'Supplier created', 201);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ListQueryDto;
      const { items, total } = await this.listSuppliersUseCase.execute(query);
      sendSuccess(res, items, 'Suppliers retrieved', 200, buildPaginationMeta(query.page, query.limit, total));
    } catch (error) {
      next(error);
    }
  };
}
