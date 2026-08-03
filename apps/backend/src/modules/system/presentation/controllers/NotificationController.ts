import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { buildPaginationMeta } from '../../../../shared/http/pagination';
import { CreateNotificationTemplateRequestDto, PreviewNotificationTemplateRequestDto } from '../../application/dtos/NotificationTemplateRequestDto';
import { ListNotificationTemplateQueryDto, ListNotificationQueryDto } from '../../application/dtos/NotificationQueryDto';
import { CreateNotificationTemplateUseCase } from '../../application/use-cases/CreateNotificationTemplateUseCase';
import { ListNotificationTemplatesUseCase } from '../../application/use-cases/ListNotificationTemplatesUseCase';
import { PreviewNotificationTemplateUseCase } from '../../application/use-cases/PreviewNotificationTemplateUseCase';
import { ListNotificationsUseCase } from '../../application/use-cases/ListNotificationsUseCase';
import { MarkNotificationReadUseCase } from '../../application/use-cases/MarkNotificationReadUseCase';

export class NotificationController {
  constructor(
    private readonly createNotificationTemplateUseCase: CreateNotificationTemplateUseCase,
    private readonly listNotificationTemplatesUseCase: ListNotificationTemplatesUseCase,
    private readonly previewNotificationTemplateUseCase: PreviewNotificationTemplateUseCase,
    private readonly listNotificationsUseCase: ListNotificationsUseCase,
    private readonly markNotificationReadUseCase: MarkNotificationReadUseCase,
  ) {}

  createTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as CreateNotificationTemplateRequestDto;
      const template = await this.createNotificationTemplateUseCase.execute(body, req.auth!.userId, {
        userId: req.auth!.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, template, 'Notification template created', 201);
    } catch (error) {
      next(error);
    }
  };

  listTemplates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ListNotificationTemplateQueryDto;
      const { items, total } = await this.listNotificationTemplatesUseCase.execute(query);
      sendSuccess(res, items, 'Notification templates retrieved', 200, buildPaginationMeta(query.page, query.limit, total));
    } catch (error) {
      next(error);
    }
  };

  preview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as PreviewNotificationTemplateRequestDto;
      const result = await this.previewNotificationTemplateUseCase.execute(req.params.templateId, body.payload ?? {});
      sendSuccess(res, result, 'Notification template preview rendered');
    } catch (error) {
      next(error);
    }
  };

  listNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ListNotificationQueryDto;
      const { items, total } = await this.listNotificationsUseCase.execute(query, req.auth!.userId);
      sendSuccess(res, items, 'Notifications retrieved', 200, buildPaginationMeta(query.page, query.limit, total));
    } catch (error) {
      next(error);
    }
  };

  markRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const notification = await this.markNotificationReadUseCase.execute(req.params.notificationId, req.auth!.userId);
      sendSuccess(res, notification, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  };
}
