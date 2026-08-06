import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';

/**
 * docs/06-tasks/task-300.md (Reservation Module Addendum #3): dateFrom/
 * dateTo required, plus the existing page/limit/sort/order contract -- same
 * shape as NewPatientReportQueryDto (task-291). docs/06-tasks/task-306.md/
 * task-309.md (Addendum #4) add an optional `status` filter (unfiltered by
 * default, unlike Reservation By Status) and `groupBy` for the new
 * day/month trend section.
 */
export class ReservationByPatientTypeReportQueryDto extends ListQueryDto {
  @IsDateString() dateFrom!: string;
  @IsDateString() dateTo!: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsIn(['day', 'month']) groupBy?: 'day' | 'month';
}
