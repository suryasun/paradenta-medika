import { INotificationTemplateRepository } from '../../domain/repositories/INotificationTemplateRepository';
import { TemplateRenderer } from '../services/TemplateRenderer';
import { NotificationTemplateNotFoundException } from '../../domain/exceptions/SystemExceptions';

export interface TemplatePreviewResult {
  subject?: string;
  body: string;
}

/** docs/06-tasks/task-196.md AC: "Preview never sends a real notification; it only renders." No Notification row is created and no provider adapter is invoked. */
export class PreviewNotificationTemplateUseCase {
  constructor(
    private readonly templateRepository: INotificationTemplateRepository,
    private readonly templateRenderer: TemplateRenderer,
  ) {}

  async execute(templateId: string, payload: Record<string, unknown>): Promise<TemplatePreviewResult> {
    const template = await this.templateRepository.findById(templateId);
    if (!template) {
      throw new NotificationTemplateNotFoundException();
    }
    return this.templateRenderer.render(
      template.body,
      template.subject ?? undefined,
      template.variableSchema as string[],
      payload,
      template.channel,
    );
  }
}
