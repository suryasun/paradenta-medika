import { IsIn, IsOptional } from 'class-validator';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';

const TEMPLATE_CHANNELS = ['EMAIL', 'SMS', 'IN_APP'] as const;
const NOTIFICATION_STATUSES = ['QUEUED', 'PROCESSING', 'SENT', 'DELIVERED', 'FAILED', 'READ', 'CANCELLED'] as const;

export class ListNotificationTemplateQueryDto extends ListQueryDto {
  @IsOptional() templateKey?: string;
  @IsOptional() @IsIn(TEMPLATE_CHANNELS) channel?: (typeof TEMPLATE_CHANNELS)[number];
}

export class ListNotificationQueryDto extends ListQueryDto {
  @IsOptional() @IsIn(NOTIFICATION_STATUSES) status?: (typeof NOTIFICATION_STATUSES)[number];
}
