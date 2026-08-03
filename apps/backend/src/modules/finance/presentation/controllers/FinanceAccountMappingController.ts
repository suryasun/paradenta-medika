import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { buildPaginationMeta } from '../../../../shared/http/pagination';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { CreateFinanceAccountMappingRequestDto } from '../../application/dtos/FinanceAccountMappingRequestDto';
import { CreateFinanceAccountMappingUseCase } from '../../application/use-cases/CreateFinanceAccountMappingUseCase';
import { ListFinanceAccountMappingsUseCase } from '../../application/use-cases/ListFinanceAccountMappingsUseCase';

export class FinanceAccountMappingController {
  constructor(
    private readonly createFinanceAccountMappingUseCase: CreateFinanceAccountMappingUseCase,
    private readonly listFinanceAccountMappingsUseCase: ListFinanceAccountMappingsUseCase,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as CreateFinanceAccountMappingRequestDto;
      const mapping = await this.createFinanceAccountMappingUseCase.execute({
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, mapping, 'Finance account mapping created', 201);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ListQueryDto & { branchId?: string };
      const { items, total } = await this.listFinanceAccountMappingsUseCase.execute(query, query.branchId);
      sendSuccess(res, items, 'Finance account mappings retrieved', 200, buildPaginationMeta(query.page, query.limit, total));
    } catch (error) {
      next(error);
    }
  };
}
