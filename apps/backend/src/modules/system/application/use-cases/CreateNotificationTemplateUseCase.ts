import { NotificationTemplate } from '@prisma/client';
import { INotificationTemplateRepository } from '../../domain/repositories/INotificationTemplateRepository';
import { TemplateRenderer } from '../services/TemplateRenderer';
import { AuditContext, IAuditService } from '../../domain/services/IAuditService';
import { CreateNotificationTemplateRequestDto } from '../dtos/NotificationTemplateRequestDto';

/** docs/06-tasks/task-195.md AC: "Template creation validates variable schema/escaping and rejects unsafe content per channel policy." */
export class CreateNotificationTemplateUseCase {
  constructor(
    private readonly templateRepository: INotificationTemplateRepository,
    private readonly templateRenderer: TemplateRenderer,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: CreateNotificationTemplateRequestDto, actorUserId: string, auditContext: AuditContext): Promise<NotificationTemplate> {
    this.templateRenderer.assertTemplateWellFormed(input.body, input.subject, input.variableSchema);

    const template = await this.templateRepository.create({
      templateKey: input.templateKey,
      channel: input.channel as never,
      locale: input.locale,
      subject: input.subject,
      body: input.body,
      variableSchema: input.variableSchema,
      classification: input.classification,
      createdBy: actorUserId,
    });

    await this.auditService.record('NotificationTemplate', template.id, 'CREATE', null, { templateKey: template.templateKey, version: template.version }, auditContext);

    return template;
  }
}
