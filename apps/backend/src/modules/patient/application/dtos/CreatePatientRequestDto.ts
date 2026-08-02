import { IsDateString, IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export enum PatientGenderDto {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export enum PatientIdentityTypeDto {
  KTP = 'KTP',
  PASSPORT = 'PASSPORT',
  SIM = 'SIM',
}

/**
 * Field names/shape per docs/03-sad/12-module-patient.md Section 21.1
 * CreatePatientRequest, with `address` flattened to a string (see
 * PatientEntity.ts note: no Geographic master hierarchy exists in Phase 1).
 */
export class CreatePatientRequestDto {
  @IsString() @MinLength(1) @MaxLength(150) fullName!: string;

  @IsEnum(PatientGenderDto) gender!: PatientGenderDto;

  @IsDateString() dateOfBirth!: string;

  @IsOptional() @IsString() @MaxLength(100) placeOfBirth?: string;

  @IsString() @MinLength(1) @MaxLength(30) phoneNumber!: string;

  @IsOptional() @IsEmail() @MaxLength(100) email?: string;

  @IsOptional() @IsEnum(PatientIdentityTypeDto) identityType?: PatientIdentityTypeDto;

  @IsOptional() @IsString() @MaxLength(50) identityNumber?: string;

  @IsString() @MinLength(1) address!: string;
}
