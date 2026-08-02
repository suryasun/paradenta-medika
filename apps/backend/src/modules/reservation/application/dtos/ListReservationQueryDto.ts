import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';

/**
 * docs/03-sad/13-module-reservation.md Section 20.3 Search Parameters,
 * `keyword` superseded by `search` per the AI Contract (priority 1) as
 * already established for other modules' list endpoints.
 */
export class ListReservationQueryDto extends ListQueryDto {
  @IsOptional() @IsUUID('4') doctorId?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() reservationType?: string;
  @IsOptional() @IsString() reservationSource?: string;
  @IsOptional() @IsDateString() dateFrom?: string;
  @IsOptional() @IsDateString() dateTo?: string;
}
