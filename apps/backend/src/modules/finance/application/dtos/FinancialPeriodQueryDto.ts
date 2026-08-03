import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';

const STATUSES = ['OPEN', 'LOCKED', 'CLOSED'] as const;

export class ListFinancialPeriodQueryDto extends ListQueryDto {
  @IsOptional() @IsUUID('4') branchId?: string;
  @IsOptional() @IsIn(STATUSES) status?: (typeof STATUSES)[number];
}
