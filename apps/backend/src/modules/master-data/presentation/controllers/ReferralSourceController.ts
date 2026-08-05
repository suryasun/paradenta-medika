import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { ListReferralSourcesUseCase } from '../../application/use-cases/ListReferralSourcesUseCase';

export class ReferralSourceController {
  constructor(private readonly listReferralSourcesUseCase: ListReferralSourcesUseCase) {}

  list = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const items = await this.listReferralSourcesUseCase.execute();
      sendSuccess(res, items, 'Referral sources retrieved');
    } catch (error) {
      next(error);
    }
  };
}
