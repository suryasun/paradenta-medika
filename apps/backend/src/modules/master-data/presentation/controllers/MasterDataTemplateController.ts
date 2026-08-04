import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { PushMasterDataTemplateRequestDto } from '../../application/dtos/MasterDataTemplateRequestDto';
import { PushMasterDataTemplateUseCase } from '../../application/use-cases/PushMasterDataTemplateUseCase';
import { GetMasterDataDriftReportUseCase } from '../../application/use-cases/GetMasterDataDriftReportUseCase';

export class MasterDataTemplateController {
  constructor(
    private readonly pushMasterDataTemplateUseCase: PushMasterDataTemplateUseCase,
    private readonly getMasterDataDriftReportUseCase: GetMasterDataDriftReportUseCase,
  ) {}

  push = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as PushMasterDataTemplateRequestDto;
      const results = await this.pushMasterDataTemplateUseCase.execute({
        templateId: req.params.templateId,
        branchIds: body.branchIds,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, results, 'Master data template pushed');
    } catch (error) {
      next(error);
    }
  };

  drift = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const report = await this.getMasterDataDriftReportUseCase.execute(req.params.templateId);
      sendSuccess(res, report, 'Master data drift report retrieved');
    } catch (error) {
      next(error);
    }
  };
}
