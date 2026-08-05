import { IsDateString, IsEmail, IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { PatientGenderDto } from './CreatePatientRequestDto';

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

  // task-284 (Epic PE1): supplementary contact/identity fields, all
  // optional, no uniqueness/format constraint beyond length.
  @IsOptional() @IsString() @MaxLength(50) insuranceNumber?: string;
  @IsOptional() @IsString() @MaxLength(100) instagramHandle?: string;
  @IsOptional() @IsString() @MaxLength(100) facebookHandle?: string;
  @IsOptional() @IsString() @MaxLength(100) tiktokHandle?: string;
  @IsOptional() @IsString() @MaxLength(30) whatsappNumber?: string;

  // task-287 (Epic PE4)
  @IsOptional() @IsUUID('4') referralSourceId?: string;
  @IsOptional() @IsUUID('4') referredByUserId?: string;

  // task-289 (Epic PE6): lets staff correct the placeholder gender/
  // birthDate a Quick Add patient was created with (see
  // QuickAddPatientUseCase) -- not part of the SAD's original §21.2
  // example, added specifically to make that placeholder correctable.
  @IsOptional() @IsEnum(PatientGenderDto) gender?: PatientGenderDto;
  @IsOptional() @IsDateString() dateOfBirth?: string;
}
