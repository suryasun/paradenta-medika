import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { buildPaginationMeta } from '../../../../shared/http/pagination';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { CreateRoleRequestDto } from '../../application/dtos/CreateRoleRequestDto';
import { AssignPermissionsRequestDto } from '../../application/dtos/AssignPermissionsRequestDto';
import { ListRolesUseCase } from '../../application/use-cases/ListRolesUseCase';
import { CreateRoleUseCase } from '../../application/use-cases/CreateRoleUseCase';
import { ListPermissionsUseCase } from '../../application/use-cases/ListPermissionsUseCase';
import { AssignPermissionsToRoleUseCase } from '../../application/use-cases/AssignPermissionsToRoleUseCase';
import { GetRolePermissionsUseCase } from '../../application/use-cases/GetRolePermissionsUseCase';

export class RoleAdminController {
  constructor(
    private readonly listRolesUseCase: ListRolesUseCase,
    private readonly createRoleUseCase: CreateRoleUseCase,
    private readonly listPermissionsUseCase: ListPermissionsUseCase,
    private readonly assignPermissionsToRoleUseCase: AssignPermissionsToRoleUseCase,
    private readonly getRolePermissionsUseCase: GetRolePermissionsUseCase,
  ) {}

  getPermissionsForRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const permissions = await this.getRolePermissionsUseCase.execute(req.params.roleId);
      sendSuccess(res, permissions, 'Role permissions retrieved');
    } catch (error) {
      next(error);
    }
  };

  listRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ListQueryDto;
      const { items, total } = await this.listRolesUseCase.execute(query);
      sendSuccess(res, items, 'Roles retrieved', 200, buildPaginationMeta(query.page, query.limit, total));
    } catch (error) {
      next(error);
    }
  };

  createRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as CreateRoleRequestDto;
      const role = await this.createRoleUseCase.execute({
        roleCode: body.roleCode,
        roleName: body.roleName,
        description: body.description,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, role, 'Role created', 201);
    } catch (error) {
      next(error);
    }
  };

  listPermissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ListQueryDto;
      const { items, total } = await this.listPermissionsUseCase.execute(query);
      sendSuccess(res, items, 'Permissions retrieved', 200, buildPaginationMeta(query.page, query.limit, total));
    } catch (error) {
      next(error);
    }
  };

  assignPermissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as AssignPermissionsRequestDto;
      const permissions = await this.assignPermissionsToRoleUseCase.execute({
        roleId: req.params.roleId,
        permissionIds: body.permissionIds,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, permissions, 'Permissions assigned');
    } catch (error) {
      next(error);
    }
  };
}
