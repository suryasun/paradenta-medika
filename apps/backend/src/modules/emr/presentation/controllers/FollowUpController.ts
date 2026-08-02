import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { CreateFollowUpRequestDto } from '../../application/dtos/CreateFollowUpRequestDto';
import { CreateFollowUpUseCase } from '../../application/use-cases/CreateFollowUpUseCase';
import { GetFollowUpsUseCase } from '../../application/use-cases/GetFollowUpsUseCase';

export class FollowUpController {
  constructor(
    private readonly createFollowUpUseCase: CreateFollowUpUseCase,
    private readonly getFollowUpsUseCase: GetFollowUpsUseCase,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as CreateFollowUpRequestDto;
      const followUp = await this.createFollowUpUseCase.execute({
        visitId: req.params.id,
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, followUp, 'Follow up created', 201);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const followUps = await this.getFollowUpsUseCase.execute(req.params.id);
      sendSuccess(res, followUps, 'Follow ups retrieved');
    } catch (error) {
      next(error);
    }
  };
}
