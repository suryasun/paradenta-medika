import { IsDateString, IsIn, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

const RESERVATION_SOURCES = ['WALK_IN', 'PHONE', 'WHATSAPP', 'WEBSITE', 'MOBILE_APP'] as const;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class ConvertTreatmentPlanToReservationRequestDto {
  @IsUUID('4') doctorId!: string;
  @IsDateString() reservationDate!: string;
  @Matches(TIME_PATTERN, { message: 'startTime must be in HH:mm format' }) startTime!: string;
  @IsString() @MaxLength(30) reservationType!: string;
  @IsIn(RESERVATION_SOURCES) source!: (typeof RESERVATION_SOURCES)[number];
  @IsOptional() @IsString() @MaxLength(1000) complaint?: string;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}
