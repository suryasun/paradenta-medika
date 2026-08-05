import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * docs/03-sad/12-module-patient.md §21.1a QuickAddPatientRequest --
 * deliberately flat and minimal, only 4 fields, no gender/dateOfBirth/
 * email/identityType. `address` here is a plain string, not the
 * structured province/regency/district/village object used by
 * CreatePatientRequestDto.
 */
export class QuickAddPatientRequestDto {
  @IsString() @MinLength(1) @MaxLength(150) fullName!: string;
  @IsString() @MinLength(1) address!: string;
  @IsString() @MinLength(1) @MaxLength(30) phoneNumber!: string;
  @IsString() @MinLength(1) @MaxLength(50) identityNumber!: string;
}
