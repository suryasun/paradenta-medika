import { IsDateString } from 'class-validator';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';

/** docs/06-tasks/task-300.md (Reservation Module Addendum #3): dateFrom/dateTo required, plus the existing page/limit/sort/order contract -- same shape as NewPatientReportQueryDto (task-291). */
export class ReservationByPatientTypeReportQueryDto extends ListQueryDto {
  @IsDateString() dateFrom!: string;
  @IsDateString() dateTo!: string;
}
