import { Notification, NotificationChannel, NotificationStatus } from '@prisma/client';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';

export interface CreateNotificationInput {
  recipientUserId: string;
  templateId?: string;
  channel: NotificationChannel;
  subject?: string;
  message: string;
  idempotencyKey: string;
}

export interface NotificationListFilter {
  recipientUserId: string;
  status?: NotificationStatus;
}

export interface INotificationRepository {
  create(input: CreateNotificationInput): Promise<Notification>;
  findById(id: string): Promise<Notification | null>;
  findByIdempotencyKey(idempotencyKey: string): Promise<Notification | null>;
  list(query: ListQueryDto, filter: NotificationListFilter): Promise<PagedResult<Notification>>;
  markStatus(
    id: string,
    status: NotificationStatus,
    fields?: { attempts?: number; lastError?: string | null; sentAt?: Date; readAt?: Date },
  ): Promise<Notification>;
}
