import { logger } from '../../../../shared/logging/logger';
import {
  INotificationProviderAdapter,
  NotificationDeliveryRequest,
  NotificationDeliveryResult,
} from '../../domain/services/INotificationProviderAdapter';

/** Logs the rendered notification instead of calling a real provider -- see INotificationProviderAdapter.ts's doc comment. */
export class ConsoleNotificationProviderAdapter implements INotificationProviderAdapter {
  async send(request: NotificationDeliveryRequest): Promise<NotificationDeliveryResult> {
    logger.info('Notification delivered (console adapter)', {
      module: 'notification-provider',
      channel: request.channel,
      recipientUserId: request.recipientUserId,
      subject: request.subject,
    });
    return { success: true };
  }
}
