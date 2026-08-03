import { IsDateString, IsIn, IsOptional, IsUUID } from 'class-validator';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';

const STATUSES = ['SUBMITTED', 'APPROVED'] as const;

/** docs/06-tasks/task-165.md AC: "List supports filter by branch, cashAccount, date range, status." */
export class ListDailyClosingQueryDto extends ListQueryDto {
  @IsOptional() @IsUUID('4') branchId?: string;
  @IsOptional() @IsUUID('4') cashAccountId?: string;
  @IsOptional() @IsIn(STATUSES) status?: (typeof STATUSES)[number];
  @IsOptional() @IsDateString() dateFrom?: string;
  @IsOptional() @IsDateString() dateTo?: string;
}
