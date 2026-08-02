import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';

/**
 * docs/03-sad/14-module-queue.md Section 56/57 QueueFilterRequest.
 */
export class ListQueueQueryDto extends ListQueryDto {
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsUUID('4') doctorId?: string;
  @IsOptional() @IsUUID('4') branchId?: string;
  @IsOptional() @IsDateString() visitDate?: string;
}
