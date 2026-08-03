import { NotificationChannel, NotificationTemplate } from '@prisma/client';
import { PagedResult } from '../../../../shared/http/pagination';
import { INotificationTemplateRepository } from '../../domain/repositories/INotificationTemplateRepository';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';

export interface ListNotificationTemplateQuery extends ListQueryDto {
  templateKey?: string;
  channel?: NotificationChannel;
  isActive?: boolean;
}

export class ListNotificationTemplatesUseCase {
  constructor(private readonly templateRepository: INotificationTemplateRepository) {}

  async execute(query: ListNotificationTemplateQuery): Promise<PagedResult<NotificationTemplate>> {
    return this.templateRepository.list(query, { templateKey: query.templateKey, channel: query.channel, isActive: query.isActive });
  }
}
