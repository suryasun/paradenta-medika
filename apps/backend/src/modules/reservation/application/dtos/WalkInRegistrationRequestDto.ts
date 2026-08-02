import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/**
 * docs/03-sad/13-module-reservation.md Section 17.2 Workflow: patient
 * lookup/registration happens first (task-001, out of this module's
 * scope); this DTO covers only the Reservation-module responsibility once
 * an existing patientId is known.
 */
export class WalkInRegistrationRequestDto {
  @IsUUID('4') patientId!: string;
  @IsUUID('4') doctorId!: string;
  @IsOptional() @IsString() @MaxLength(1000) complaint?: string;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}
