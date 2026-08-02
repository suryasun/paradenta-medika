import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { buildPaginationMeta } from '../../../../shared/http/pagination';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { CrudUseCases } from '../../application/shared/crudUseCaseFactory';

export interface CrudController {
  list: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  create: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  detail: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  update: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

/**
 * All six Master Data entities (task-021..026) expose the identical
 * list/create/detail/update controller shape; the request DTOs are designed
 * to mirror their corresponding domain Create/Update input contracts field
 * for field, so the validated body is passed straight through.
 */
export function buildCrudController<T, TCreate, TUpdate>(
  useCases: CrudUseCases<T, TCreate, TUpdate>,
  entityLabel: string,
  idParam = 'id',
): CrudController {
  return {
    list: async (req, res, next) => {
      try {
        const query = req.query as unknown as ListQueryDto;
        const { items, total } = await useCases.list(query);
        sendSuccess(res, items, `${entityLabel} retrieved`, 200, buildPaginationMeta(query.page, query.limit, total));
      } catch (error) {
        next(error);
      }
    },
    create: async (req, res, next) => {
      try {
        if (!req.auth) throw new AuthenticationException();
        const entity = await useCases.create(req.body as TCreate, {
          actorUserId: req.auth.userId,
          ipAddress: req.ip,
          correlationId: req.correlationId,
        });
        sendSuccess(res, entity, `${entityLabel} created`, 201);
      } catch (error) {
        next(error);
      }
    },
    detail: async (req, res, next) => {
      try {
        const entity = await useCases.get(req.params[idParam]);
        sendSuccess(res, entity, `${entityLabel} retrieved`);
      } catch (error) {
        next(error);
      }
    },
    update: async (req, res, next) => {
      try {
        if (!req.auth) throw new AuthenticationException();
        const entity = await useCases.update(req.params[idParam], req.body as TUpdate, {
          actorUserId: req.auth.userId,
          ipAddress: req.ip,
          correlationId: req.correlationId,
        });
        sendSuccess(res, entity, `${entityLabel} updated`);
      } catch (error) {
        next(error);
      }
    },
  };
}
