import { Notification, NotificationStatus, Prisma } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult, sanitizeSortField } from '../../../../shared/http/pagination';
import { CreateNotificationInput, INotificationRepository, NotificationListFilter } from '../../domain/repositories/INotificationRepository';

const ALLOWED_SORT_FIELDS = ['createdAt'] as const;

export class NotificationRepository implements INotificationRepository {
  async create(input: CreateNotificationInput): Promise<Notification> {
    return prisma.notification.create({
      data: {
        recipientUserId: input.recipientUserId,
        templateId: input.templateId,
        channel: input.channel,
        subject: input.subject,
        message: input.message,
        idempotencyKey: input.idempotencyKey,
      },
    });
  }

  async findById(id: string): Promise<Notification | null> {
    return prisma.notification.findUnique({ where: { id } });
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<Notification | null> {
    return prisma.notification.findUnique({ where: { idempotencyKey } });
  }

  async list(query: ListQueryDto, filter: NotificationListFilter): Promise<PagedResult<Notification>> {
    const where: Prisma.NotificationWhereInput = {
      recipientUserId: filter.recipientUserId,
      status: filter.status,
    };
    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { [sanitizeSortField(query.sort, ALLOWED_SORT_FIELDS)]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.notification.count({ where }),
    ]);
    return { items, total };
  }

  async markStatus(
    id: string,
    status: NotificationStatus,
    fields?: { attempts?: number; lastError?: string | null; sentAt?: Date; readAt?: Date },
  ): Promise<Notification> {
    return prisma.notification.update({
      where: { id },
      data: {
        status,
        attempts: fields?.attempts,
        lastError: fields?.lastError,
        sentAt: fields?.sentAt,
        readAt: fields?.readAt,
      },
    });
  }
}
