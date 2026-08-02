import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Field names/shape per docs/03-sad/12-module-patient.md Section 21.2
 * UpdatePatientRequest. Identity fields are intentionally absent: the
 * documented example does not include them, and Section 5.4 treats
 * identity changes as a separately-permissioned action not specified at
 * the API level for Phase 1.
 */
export class UpdatePatientRequestDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(150) fullName?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(30) phoneNumber?: string;
  @IsOptional() @IsEmail() @MaxLength(100) email?: string;
  @IsOptional() @IsString() @MinLength(1) address?: string;
}
