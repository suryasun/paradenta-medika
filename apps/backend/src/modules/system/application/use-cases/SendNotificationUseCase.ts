import { Notification } from '@prisma/client';
import { IEventBus } from '../../../../shared/events/EventBus';
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { INotificationTemplateRepository } from '../../domain/repositories/INotificationTemplateRepository';
import { INotificationProviderAdapter } from '../../domain/services/INotificationProviderAdapter';
import { TemplateRenderer } from '../services/TemplateRenderer';
import { NotificationTemplateNotFoundException } from '../../domain/exceptions/SystemExceptions';

export interface SendNotificationInput {
  templateKey: string;
  recipientUserId: string;
  payload: Record<string, unknown>;
  idempotencyKey: string;
}

const MAX_ATTEMPTS = 3;
const TERMINAL_STATUSES = ['SENT', 'DELIVERED', 'READ'];

/**
 * docs/06-tasks/task-199.md, UC-SYS-005 step 3-5: internal service API
 * called by other modules (e.g. Reservation reminders, Warehouse expiry
 * alerts, Finance closing reminders -- wiring those specific triggers is
 * explicitly out of this task's scope per its own Definition of Done).
 * No job-queue worker exists in this codebase, so retries are driven by
 * the caller invoking `execute()` again with the same `idempotencyKey`
 * (the same synchronous-execution precedent as Epic AH's
 * CreateReportJobUseCase) rather than an internal scheduler.
 */
export class SendNotificationUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly templateRepository: INotificationTemplateRepository,
    private readonly templateRenderer: TemplateRenderer,
    private readonly providerAdapter: INotificationProviderAdapter,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: SendNotificationInput): Promise<Notification> {
    const existing = await this.notificationRepository.findByIdempotencyKey(input.idempotencyKey);
    if (existing) {
      if (TERMINAL_STATUSES.includes(existing.status) || (existing.status === 'FAILED' && existing.attempts >= MAX_ATTEMPTS)) {
        // Already delivered, or permanently dead-lettered: idempotent no-op, no duplicate delivery.
        return existing;
      }
      return this.attemptDelivery(existing);
    }

    const template = await this.templateRepository.findLatestActiveByKey(input.templateKey);
    if (!template) {
      throw new NotificationTemplateNotFoundException();
    }
    const rendered = this.templateRenderer.render(
      template.body,
      template.subject ?? undefined,
      template.variableSchema as string[],
      input.payload,
      template.channel,
    );

    const created = await this.notificationRepository.create({
      recipientUserId: input.recipientUserId,
      templateId: template.id,
      channel: template.channel,
      subject: rendered.subject,
      message: rendered.body,
      idempotencyKey: input.idempotencyKey,
    });

    return this.attemptDelivery(created);
  }

  private async attemptDelivery(notification: Notification): Promise<Notification> {
    const attempts = notification.attempts + 1;
    const result = await this.providerAdapter.send({
      channel: notification.channel,
      recipientUserId: notification.recipientUserId,
      subject: notification.subject ?? undefined,
      message: notification.message,
    });

    if (result.success) {
      const sent = await this.notificationRepository.markStatus(notification.id, 'SENT', { attempts, sentAt: new Date(), lastError: null });
      await this.eventBus.publish('system.notification.delivered.v1', {
        notificationId: sent.id,
        recipientUserId: sent.recipientUserId,
        channel: sent.channel,
      });
      return sent;
    }

    // Dead-letter once the retry budget is exhausted; otherwise stay QUEUED so a
    // subsequent call with the same idempotencyKey can retry (UC-SYS-005 step 5).
    const isDeadLettered = attempts >= MAX_ATTEMPTS;
    const failed = await this.notificationRepository.markStatus(notification.id, isDeadLettered ? 'FAILED' : 'QUEUED', {
      attempts,
      lastError: result.errorSafeMessage ?? 'Delivery failed',
    });
    if (isDeadLettered) {
      await this.eventBus.publish('system.notification.dead-lettered.v1', {
        notificationId: failed.id,
        recipientUserId: failed.recipientUserId,
        channel: failed.channel,
        attempts,
      });
    }
    return failed;
  }
}
