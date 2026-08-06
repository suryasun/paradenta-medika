import { IsDateString, IsOptional, IsUUID } from 'class-validator';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';

/**
 * docs/06-tasks/task-301.md (Reservation Module Addendum #3): dateFrom/
 * dateTo required, plus an optional doctorId to narrow the paginated
 * `items` table to one doctor -- the `summary` breakdown chart always
 * compares all doctors regardless of this filter (see the use case).
 */
export class ReservationByDoctorReportQueryDto extends ListQueryDto {
  @IsDateString() dateFrom!: string;
  @IsDateString() dateTo!: string;
  @IsOptional() @IsUUID('4') doctorId?: string;
}
