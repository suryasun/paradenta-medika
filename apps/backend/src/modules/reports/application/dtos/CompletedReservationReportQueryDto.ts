import { IsDateString } from 'class-validator';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';

/** docs/06-tasks/task-299.md (Reservation Module Addendum #2, R7): dateFrom/dateTo required, plus the existing page/limit/sort/order contract -- same shape as NewPatientReportQueryDto (task-291). */
export class CompletedReservationReportQueryDto extends ListQueryDto {
  @IsDateString() dateFrom!: string;
  @IsDateString() dateTo!: string;
}
