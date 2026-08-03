import { NotificationTemplate, Prisma } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult, sanitizeSortField } from '../../../../shared/http/pagination';
import {
  CreateNotificationTemplateInput,
  INotificationTemplateRepository,
  NotificationTemplateListFilter,
} from '../../domain/repositories/INotificationTemplateRepository';

const ALLOWED_SORT_FIELDS = ['createdAt', 'templateKey', 'version'] as const;

export class NotificationTemplateRepository implements INotificationTemplateRepository {
  async create(input: CreateNotificationTemplateInput): Promise<NotificationTemplate> {
    const latest = await prisma.notificationTemplate.findFirst({
      where: { templateKey: input.templateKey },
      orderBy: { version: 'desc' },
    });
    return prisma.notificationTemplate.create({
      data: {
        templateKey: input.templateKey,
        channel: input.channel,
        locale: input.locale,
        subject: input.subject,
        body: input.body,
        variableSchema: input.variableSchema as Prisma.InputJsonValue,
        classification: input.classification ?? 'internal',
        version: (latest?.version ?? 0) + 1,
        createdBy: input.createdBy,
      },
    });
  }

  async list(query: ListQueryDto, filter: NotificationTemplateListFilter): Promise<PagedResult<NotificationTemplate>> {
    const where: Prisma.NotificationTemplateWhereInput = {
      templateKey: filter.templateKey,
      channel: filter.channel,
      isActive: filter.isActive,
    };
    const [items, total] = await Promise.all([
      prisma.notificationTemplate.findMany({
        where,
        orderBy: { [sanitizeSortField(query.sort, ALLOWED_SORT_FIELDS)]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.notificationTemplate.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<NotificationTemplate | null> {
    return prisma.notificationTemplate.findUnique({ where: { id } });
  }

  async findLatestActiveByKey(templateKey: string): Promise<NotificationTemplate | null> {
    return prisma.notificationTemplate.findFirst({
      where: { templateKey, isActive: true },
      orderBy: { version: 'desc' },
    });
  }
}
