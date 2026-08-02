import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { CreateReferralRequestDto } from '../../application/dtos/CreateReferralRequestDto';
import { CreateReferralUseCase } from '../../application/use-cases/CreateReferralUseCase';
import { GetReferralsUseCase } from '../../application/use-cases/GetReferralsUseCase';

export class ReferralController {
  constructor(
    private readonly createReferralUseCase: CreateReferralUseCase,
    private readonly getReferralsUseCase: GetReferralsUseCase,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as CreateReferralRequestDto;
      const referral = await this.createReferralUseCase.execute({
        visitId: req.params.id,
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, referral, 'Referral created', 201);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const referrals = await this.getReferralsUseCase.execute(req.params.id);
      sendSuccess(res, referrals, 'Referrals retrieved');
    } catch (error) {
      next(error);
    }
  };
}
