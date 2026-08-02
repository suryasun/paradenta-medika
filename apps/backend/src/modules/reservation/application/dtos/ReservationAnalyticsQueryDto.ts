import { IsDateString, IsOptional, IsUUID } from 'class-validator';

/**
 * docs/06-tasks/task-060.md: "Response supports a configurable date range."
 * dateFrom/dateTo default to the trailing 30 days when omitted (see
 * ReservationAnalyticsUseCase) -- no literal default is specified in the
 * SAD, a reasonable dashboard convention.
 */
export class ReservationAnalyticsQueryDto {
  @IsOptional() @IsDateString() dateFrom?: string;
  @IsOptional() @IsDateString() dateTo?: string;
  @IsOptional() @IsUUID('4') branchId?: string;
}
