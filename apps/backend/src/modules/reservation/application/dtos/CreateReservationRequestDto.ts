import { IsDateString, IsEnum, IsIn, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

/**
 * docs/03-sad/13-module-reservation.md Section 8 Reservation Types.
 */
export enum ReservationTypeDto {
  APPOINTMENT = 'APPOINTMENT',
  WALK_IN = 'WALK_IN',
  FOLLOW_UP = 'FOLLOW_UP',
  EMERGENCY = 'EMERGENCY',
  CONSULTATION = 'CONSULTATION',
}

const RESERVATION_SOURCES = ['WALK_IN', 'PHONE', 'WHATSAPP', 'WEBSITE', 'MOBILE_APP'] as const;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Field names/shape per docs/03-sad/13-module-reservation.md Section 21.1
 * Create Reservation Request. `scheduleId` and `branchId` are intentionally
 * absent: the matching schedule is resolved server-side by
 * DoctorScheduleValidator (never trusting a client-supplied schedule FK for
 * a slot-capacity decision) and branchId is derived from the doctor's
 * branch, since Section 21.1's example never includes a branch field at all.
 *
 * `reservationDate`/`startTime` are optional: task-002.md's Backend Scope
 * lists only one added endpoint (POST /api/v1/reservations) for both
 * CreateReservationUseCase and WalkInRegistrationUseCase, so the controller
 * routes to the Walk-in flow when they -- and `source`/`reservationType`
 * resolve to WALK_IN -- are omitted, rather than inventing a second,
 * undocumented endpoint path.
 */
export class CreatePatientReservationRequestDto {
  @IsUUID('4') patientId!: string;
  @IsUUID('4') doctorId!: string;
  @IsOptional() @IsDateString() reservationDate?: string;
  @IsOptional() @Matches(TIME_PATTERN, { message: 'startTime must be in HH:mm format' }) startTime?: string;
  @IsEnum(ReservationTypeDto) reservationType!: ReservationTypeDto;
  @IsIn(RESERVATION_SOURCES) source!: (typeof RESERVATION_SOURCES)[number];
  @IsOptional() @IsString() @MaxLength(1000) complaint?: string;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}
