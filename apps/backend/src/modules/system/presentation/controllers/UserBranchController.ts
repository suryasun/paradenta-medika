import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { AssignUserBranchRequestDto } from '../../application/dtos/AssignUserBranchRequestDto';
import { toUserBranchResponse } from '../../application/dtos/UserBranchResponseDto';
import { AssignUserBranchUseCase } from '../../application/use-cases/AssignUserBranchUseCase';
import { ListUserBranchesUseCase } from '../../application/use-cases/ListUserBranchesUseCase';

export class UserBranchController {
  constructor(
    private readonly assignUserBranchUseCase: AssignUserBranchUseCase,
    private readonly listUserBranchesUseCase: ListUserBranchesUseCase,
  ) {}

  assign = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as AssignUserBranchRequestDto;
      const assignments = await this.assignUserBranchUseCase.execute({
        userId: req.params.userId,
        branchAssignments: body.branchAssignments.map((entry) => ({
          branchId: entry.branchId,
          isDefault: entry.isDefault,
          effectiveFrom: entry.effectiveFrom ? new Date(entry.effectiveFrom) : undefined,
        })),
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, assignments.map(toUserBranchResponse), 'Branch assignments updated');
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const assignments = await this.listUserBranchesUseCase.execute({
        userId: req.params.userId,
        requesterUserId: req.auth.userId,
        requesterPermissionKeys: req.auth.permissionKeys,
      });
      sendSuccess(res, assignments.map(toUserBranchResponse), 'Branch assignments retrieved');
    } catch (error) {
      next(error);
    }
  };
}
