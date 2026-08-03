import { IsDateString, IsIn, IsOptional, IsUUID } from 'class-validator';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';

const STATUSES = ['DRAFT', 'POSTED', 'REVERSED', 'VOIDED'] as const;

/** docs/06-tasks/task-148.md AC: "List supports pagination/filter by branch, date range, status, account." */
export class ListJournalQueryDto extends ListQueryDto {
  @IsOptional() @IsUUID('4') branchId?: string;
  @IsOptional() @IsIn(STATUSES) status?: (typeof STATUSES)[number];
  @IsOptional() @IsDateString() dateFrom?: string;
  @IsOptional() @IsDateString() dateTo?: string;
  @IsOptional() @IsUUID('4') accountId?: string;
}
