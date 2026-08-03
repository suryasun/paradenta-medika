import { IsIn, IsOptional, IsString } from 'class-validator';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';

const STATUSES = ['QUEUED', 'RUNNING', 'SUCCEEDED', 'RETRYING', 'FAILED', 'CANCELLED', 'DEAD_LETTER'] as const;

export class ListBackgroundJobQueryDto extends ListQueryDto {
  @IsOptional() @IsString() jobType?: string;
  @IsOptional() @IsIn(STATUSES) status?: (typeof STATUSES)[number];
}
