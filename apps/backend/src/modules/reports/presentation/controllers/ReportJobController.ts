import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { CreateReportJobRequestDto } from '../../application/dtos/CreateReportJobRequestDto';
import { CreateReportJobUseCase } from '../../application/use-cases/CreateReportJobUseCase';
import { GetReportJobUseCase } from '../../application/use-cases/GetReportJobUseCase';
import { CancelReportJobUseCase } from '../../application/use-cases/CancelReportJobUseCase';
import { GetReportSnapshotUseCase } from '../../application/use-cases/GetReportSnapshotUseCase';
import { DownloadReportExportUseCase } from '../../application/use-cases/DownloadReportExportUseCase';

export class ReportJobController {
  constructor(
    private readonly createReportJobUseCase: CreateReportJobUseCase,
    private readonly getReportJobUseCase: GetReportJobUseCase,
    private readonly cancelReportJobUseCase: CancelReportJobUseCase,
    private readonly getReportSnapshotUseCase: GetReportSnapshotUseCase,
    private readonly downloadReportExportUseCase: DownloadReportExportUseCase,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as CreateReportJobRequestDto;
      const result = await this.createReportJobUseCase.execute({
        reportCode: req.params.reportCode,
        filters: body.filters,
        format: body.format,
        actorUserId: req.auth!.userId,
        requesterPermissions: req.auth!.permissionKeys,
      });
      sendSuccess(res, result, 'Report job created', 201);
    } catch (error) {
      next(error);
    }
  };

  detail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const job = await this.getReportJobUseCase.execute(req.params.jobId);
      sendSuccess(res, job, 'Report job retrieved');
    } catch (error) {
      next(error);
    }
  };

  cancel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const job = await this.cancelReportJobUseCase.execute(req.params.jobId);
      sendSuccess(res, job, 'Report job cancellation processed');
    } catch (error) {
      next(error);
    }
  };

  snapshot = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const snapshot = await this.getReportSnapshotUseCase.execute(req.params.snapshotId);
      sendSuccess(res, snapshot, 'Report snapshot retrieved');
    } catch (error) {
      next(error);
    }
  };

  download = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const artifact = await this.downloadReportExportUseCase.execute(req.params.artifactId, {
        userId: req.auth!.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${artifact.filename}"`);
      res.status(200).send(artifact.content);
    } catch (error) {
      next(error);
    }
  };
}
