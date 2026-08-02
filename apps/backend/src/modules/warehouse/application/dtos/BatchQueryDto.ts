import { IsDateString, IsIn, IsOptional, IsUUID } from 'class-validator';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';

const STATUSES = ['ACTIVE', 'QUARANTINED', 'EXPIRED', 'DEPLETED'] as const;

/** docs/06-tasks/task-134.md AC: "List supports filter by itemId, warehouseId, expiry range, status." */
export class ListBatchQueryDto extends ListQueryDto {
  @IsOptional() @IsUUID('4') itemId?: string;
  @IsOptional() @IsUUID('4') warehouseId?: string;
  @IsOptional() @IsIn(STATUSES) status?: (typeof STATUSES)[number];
  @IsOptional() @IsDateString() expiryFrom?: string;
  @IsOptional() @IsDateString() expiryTo?: string;
}
