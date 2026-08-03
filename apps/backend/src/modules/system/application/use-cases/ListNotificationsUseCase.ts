import { Notification, NotificationStatus } from '@prisma/client';
import { PagedResult } from '../../../../shared/http/pagination';
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';

export interface ListNotificationQuery extends ListQueryDto {
  status?: NotificationStatus;
}

/** docs/06-tasks/task-197.md AC: "List is scoped strictly to the authenticated recipient." recipientUserId always comes from the auth context, never a client-supplied filter. */
export class ListNotificationsUseCase {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(query: ListNotificationQuery, recipientUserId: string): Promise<PagedResult<Notification>> {
    return this.notificationRepository.list(query, { recipientUserId, status: query.status });
  }
}
