import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { AuthenticationException, ValidationException } from '../../../../shared/http/exceptions';
import { UploadAttachmentRequestDto } from '../../application/dtos/UploadAttachmentRequestDto';
import { AnnotateAttachmentRequestDto } from '../../application/dtos/AnnotateAttachmentRequestDto';
import { UploadAttachmentUseCase } from '../../application/use-cases/UploadAttachmentUseCase';
import { GetAttachmentDetailUseCase } from '../../application/use-cases/GetAttachmentDetailUseCase';
import { DownloadAttachmentUseCase } from '../../application/use-cases/DownloadAttachmentUseCase';
import { AnnotateAttachmentUseCase } from '../../application/use-cases/AnnotateAttachmentUseCase';
import { ListVisitAttachmentsUseCase } from '../../application/use-cases/ListVisitAttachmentsUseCase';
import { ArchiveAttachmentUseCase } from '../../application/use-cases/ArchiveAttachmentUseCase';
import { RestoreAttachmentVersionUseCase } from '../../application/use-cases/RestoreAttachmentVersionUseCase';
import { GetAttachmentVersionsUseCase } from '../../application/use-cases/GetAttachmentVersionsUseCase';

export class AttachmentController {
  constructor(
    private readonly uploadAttachmentUseCase: UploadAttachmentUseCase,
    private readonly getAttachmentDetailUseCase: GetAttachmentDetailUseCase,
    private readonly downloadAttachmentUseCase: DownloadAttachmentUseCase,
    private readonly annotateAttachmentUseCase: AnnotateAttachmentUseCase,
    private readonly listVisitAttachmentsUseCase: ListVisitAttachmentsUseCase,
    private readonly archiveAttachmentUseCase: ArchiveAttachmentUseCase,
    private readonly restoreAttachmentVersionUseCase: RestoreAttachmentVersionUseCase,
    private readonly getAttachmentVersionsUseCase: GetAttachmentVersionsUseCase,
  ) {}

  upload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      if (!req.file) throw new ValidationException([{ field: 'file', message: 'A file is required' }]);
      const body = req.body as UploadAttachmentRequestDto;
      const attachment = await this.uploadAttachmentUseCase.execute({
        ...body,
        file: req.file,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, attachment, 'Attachment uploaded', 201);
    } catch (error) {
      next(error);
    }
  };

  detail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const attachment = await this.getAttachmentDetailUseCase.execute(req.params.id);
      sendSuccess(res, attachment, 'Attachment retrieved');
    } catch (error) {
      next(error);
    }
  };

  download = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const result = await this.downloadAttachmentUseCase.execute({
        attachmentId: req.params.id,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, result, 'Download URL generated');
    } catch (error) {
      next(error);
    }
  };

  annotate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as AnnotateAttachmentRequestDto;
      const annotation = await this.annotateAttachmentUseCase.execute({
        attachmentId: req.params.id,
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, annotation, 'Annotation added', 201);
    } catch (error) {
      next(error);
    }
  };

  listByVisit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const attachments = await this.listVisitAttachmentsUseCase.execute(req.params.visitId);
      sendSuccess(res, attachments, 'Attachments retrieved');
    } catch (error) {
      next(error);
    }
  };

  archive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const attachment = await this.archiveAttachmentUseCase.execute({
        attachmentId: req.params.id,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, attachment, 'Attachment archived');
    } catch (error) {
      next(error);
    }
  };

  versions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const versions = await this.getAttachmentVersionsUseCase.execute(req.params.id);
      sendSuccess(res, versions, 'Attachment versions retrieved');
    } catch (error) {
      next(error);
    }
  };

  restoreVersion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const attachment = await this.restoreAttachmentVersionUseCase.execute({
        attachmentId: req.params.id,
        versionNumber: Number(req.params.version),
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, attachment, 'Version restored');
    } catch (error) {
      next(error);
    }
  };
}
