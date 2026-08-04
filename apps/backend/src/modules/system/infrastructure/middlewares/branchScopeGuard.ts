import { NextFunction, Request, RequestHandler, Response } from 'express';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { IUserRoleRepository } from '../../domain/repositories/IUserRoleRepository';
import { IUserBranchRepository } from '../../domain/repositories/IUserBranchRepository';
import { BranchOutOfScopeException } from '../../domain/exceptions/SystemExceptions';

export type BranchIdExtractor = (req: Request) => string | undefined;

/**
 * docs/06-tasks/task-216.md: reusable branch-scope enforcement, retrofittable
 * onto any branch-scoped controller across any module. `getTargetBranchId`
 * lets each call site say where the target branch lives in its own request
 * shape (path param, body field, query filter) without this guard knowing
 * about any module's route conventions.
 *
 * Cross-branch roles (Role.isCrossBranch -- task-217) bypass the
 * intersection entirely, per the Actor Matrix pattern (Owner/Administrator/
 * Security Admin). A request that doesn't target a specific branch (the
 * extractor returns undefined -- e.g. a create payload that will default
 * via ResolveDefaultBranchUseCase) is allowed through; this guard only
 * rejects an *explicit* out-of-scope branch target.
 */
export function createBranchScopeGuard(
  userRoleRepository: IUserRoleRepository,
  userBranchRepository: IUserBranchRepository,
  getTargetBranchId: BranchIdExtractor,
): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) {
        next(new AuthenticationException());
        return;
      }

      const targetBranchId = getTargetBranchId(req);
      if (!targetBranchId) {
        next();
        return;
      }

      const roles = await userRoleRepository.listRolesForUser(req.auth.userId);
      if (roles.some((role) => role.isCrossBranch)) {
        next();
        return;
      }

      const ownAssignments = await userBranchRepository.listForUser(req.auth.userId);
      const isInScope = ownAssignments.some((assignment) => assignment.branchId === targetBranchId);
      if (!isInScope) {
        next(new BranchOutOfScopeException());
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
