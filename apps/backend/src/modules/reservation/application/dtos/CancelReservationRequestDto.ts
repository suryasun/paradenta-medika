import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * docs/03-sad/13-module-reservation.md Section 18.2 Cancellation Rules:
 * "Wajib mengisi alasan pembatalan" (cancellation reason is mandatory).
 */
export class CancelReservationRequestDto {
  @IsString() @MinLength(1) @MaxLength(500) reason!: string;
}
