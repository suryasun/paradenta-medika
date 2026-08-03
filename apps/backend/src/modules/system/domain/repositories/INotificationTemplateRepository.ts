import { NotificationChannel, NotificationTemplate } from '@prisma/client';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';

export interface CreateNotificationTemplateInput {
  templateKey: string;
  channel: NotificationChannel;
  locale: string;
  subject?: string;
  body: string;
  variableSchema: string[];
  classification?: string;
  createdBy: string;
}

export interface NotificationTemplateListFilter {
  templateKey?: string;
  channel?: NotificationChannel;
  isActive?: boolean;
}

export interface INotificationTemplateRepository {
  /** Inserts a new version: `version` = 1 + the highest existing version for this templateKey (Section 5.4's "immutable after published"). */
  create(input: CreateNotificationTemplateInput): Promise<NotificationTemplate>;
  list(query: ListQueryDto, filter: NotificationTemplateListFilter): Promise<PagedResult<NotificationTemplate>>;
  findById(id: string): Promise<NotificationTemplate | null>;
  /** The highest-version active template for a key -- what SendNotificationUseCase actually renders. */
  findLatestActiveByKey(templateKey: string): Promise<NotificationTemplate | null>;
}
