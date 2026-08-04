import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { buildPaginationMeta } from '../../../../shared/http/pagination';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { ListUsersQueryDto } from '../../application/dtos/ListUsersQueryDto';
import { CreateUserRequestDto } from '../../application/dtos/CreateUserRequestDto';
import { UpdateUserRequestDto } from '../../application/dtos/UpdateUserRequestDto';
import { AssignRoleRequestDto } from '../../application/dtos/AssignRoleRequestDto';
import { RevokeSessionsRequestDto } from '../../application/dtos/RevokeSessionsRequestDto';
import { toUserAdminResponse } from '../../application/dtos/UserAdminResponseDto';
import { CreateUserUseCase } from '../../application/use-cases/CreateUserUseCase';
import { ListUsersUseCase } from '../../application/use-cases/ListUsersUseCase';
import { GetUserUseCase } from '../../application/use-cases/GetUserUseCase';
import { UpdateUserUseCase } from '../../application/use-cases/UpdateUserUseCase';
import { ActivateUserUseCase } from '../../application/use-cases/ActivateUserUseCase';
import { DeactivateUserUseCase } from '../../application/use-cases/DeactivateUserUseCase';
import { AssignRoleToUserUseCase } from '../../application/use-cases/AssignRoleToUserUseCase';
import { RevokeUserSessionsUseCase } from '../../application/use-cases/RevokeUserSessionsUseCase';

export class UserAdminController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly activateUserUseCase: ActivateUserUseCase,
    private readonly deactivateUserUseCase: DeactivateUserUseCase,
    private readonly assignRoleToUserUseCase: AssignRoleToUserUseCase,
    private readonly revokeUserSessionsUseCase: RevokeUserSessionsUseCase,
  ) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const query = req.query as unknown as ListUsersQueryDto;
      const { items, total } = await this.listUsersUseCase.execute({ query, branchId: query.branchId, requesterUserId: req.auth.userId });
      sendSuccess(res, items.map((user) => toUserAdminResponse(user)), 'Users retrieved', 200, buildPaginationMeta(query.page, query.limit, total));
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as CreateUserRequestDto;
      const user = await this.createUserUseCase.execute({
        username: body.username,
        email: body.email,
        password: body.password,
        roleIds: body.roleIds,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, toUserAdminResponse(user), 'User created', 201);
    } catch (error) {
      next(error);
    }
  };

  detail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { user, roleIds } = await this.getUserUseCase.execute(req.params.userId);
      sendSuccess(res, toUserAdminResponse(user, roleIds), 'User retrieved');
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as UpdateUserRequestDto;
      const user = await this.updateUserUseCase.execute({
        userId: req.params.userId,
        email: body.email,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, toUserAdminResponse(user), 'User updated');
    } catch (error) {
      next(error);
    }
  };

  activate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const user = await this.activateUserUseCase.execute({
        userId: req.params.userId,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, toUserAdminResponse(user), 'User activated');
    } catch (error) {
      next(error);
    }
  };

  deactivate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const user = await this.deactivateUserUseCase.execute({
        userId: req.params.userId,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, toUserAdminResponse(user), 'User deactivated');
    } catch (error) {
      next(error);
    }
  };

  assignRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as AssignRoleRequestDto;
      const roles = await this.assignRoleToUserUseCase.execute({
        userId: req.params.userId,
        roleIds: body.roleIds,
        reason: body.reason,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, roles, 'Roles assigned');
    } catch (error) {
      next(error);
    }
  };

  revokeSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as RevokeSessionsRequestDto;
      await this.revokeUserSessionsUseCase.execute({
        userId: req.params.userId,
        sessionId: body.sessionId,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, null, 'Sessions revoked');
    } catch (error) {
      next(error);
    }
  };
}
