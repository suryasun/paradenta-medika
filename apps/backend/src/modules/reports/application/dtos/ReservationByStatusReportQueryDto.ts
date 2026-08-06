import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';

/**
 * docs/06-tasks/task-305.md (Reservation Module Addendum #4): renamed from
 * CompletedReservationReportQueryDto (task-299) -- dateFrom/dateTo required
 * as before, plus a new optional `status` filter (defaults to COMPLETED in
 * the use case when omitted, preserving the report's prior behavior) and an
 * optional `groupBy` to switch the trend chart between day/month buckets.
 * `status` is a plain string (not `@IsEnum`), matching
 * ListReservationQueryDto's existing convention -- IReservationRepository's
 * filters already type `status` as `string`, not the Prisma enum.
 */
export class ReservationByStatusReportQueryDto extends ListQueryDto {
  @IsDateString() dateFrom!: string;
  @IsDateString() dateTo!: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsIn(['day', 'month']) groupBy?: 'day' | 'month';
}
