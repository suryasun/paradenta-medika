import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';
import { ReservationTypeDto } from './CreateReservationRequestDto';

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Editable fields per docs/03-sad/13-module-reservation.md Section 13.2:
 * Doctor, Date, Time Slot, Complaint, Notes, Reservation Type.
 */
export class UpdateReservationRequestDto {
  @IsOptional() @IsUUID('4') doctorId?: string;
  @IsOptional() @IsDateString() reservationDate?: string;
  @IsOptional() @Matches(TIME_PATTERN, { message: 'startTime must be in HH:mm format' }) startTime?: string;
  @IsOptional() @IsEnum(ReservationTypeDto) reservationType?: ReservationTypeDto;
  @IsOptional() @IsString() @MaxLength(1000) complaint?: string;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}
