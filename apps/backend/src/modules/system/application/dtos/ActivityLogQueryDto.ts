import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';

export class ActivityLogQueryDto extends ListQueryDto {
  @IsOptional() @IsDateString() dateFrom?: string;
  @IsOptional() @IsDateString() dateTo?: string;
  @IsOptional() @IsString() module?: string;
  @IsOptional() @IsUUID('4') actorUserId?: string;
  @IsOptional() @IsUUID('4') branchId?: string;
  @IsOptional() @IsString() action?: string;
}
