import { IsDateString, IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength } from 'class-validator';

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * docs/06-tasks/task-292.md: the same 4 fields as QuickAddPatientRequestDto
 * (docs/03-sad/12-module-patient.md §21.1a) plus doctorId/reservationDate/
 * startTime (required, matching CreateReservationRequestDto's field names/
 * types) and an optional complaint.
 */
export class QuickNewPatientCallRequestDto {
  @IsString() @MinLength(1) @MaxLength(150) fullName!: string;
  @IsString() @MinLength(1) address!: string;
  @IsString() @MinLength(1) @MaxLength(30) phoneNumber!: string;
  @IsString() @MinLength(1) @MaxLength(50) identityNumber!: string;
  @IsUUID('4') doctorId!: string;
  @IsDateString() reservationDate!: string;
  @Matches(TIME_PATTERN, { message: 'startTime must be in HH:mm format' }) startTime!: string;
  @IsOptional() @IsString() @MaxLength(1000) complaint?: string;
}
