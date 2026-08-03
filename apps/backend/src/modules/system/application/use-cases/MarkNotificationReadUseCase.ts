import { Notification } from '@prisma/client';
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { NotificationNotFoundException, NotificationNotOwnedException } from '../../domain/exceptions/SystemExceptions';

/** docs/06-tasks/task-198.md AC: "403/404 when attempting to mark another recipient's notification as read." */
export class MarkNotificationReadUseCase {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(notificationId: string, recipientUserId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findById(notificationId);
    if (!notification) {
      throw new NotificationNotFoundException();
    }
    if (notification.recipientUserId !== recipientUserId) {
      throw new NotificationNotOwnedException();
    }
    return this.notificationRepository.markStatus(notificationId, 'READ', { readAt: new Date() });
  }
}
