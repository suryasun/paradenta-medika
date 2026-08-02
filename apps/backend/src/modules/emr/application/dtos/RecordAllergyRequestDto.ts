import { IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

/** Mirrors Prisma's AllergyType (docs/03-sad/15-module-emr.md Section 19 "Allergy Types"). */
export enum AllergyTypeDto {
  DRUG = 'DRUG',
  FOOD = 'FOOD',
  LATEX = 'LATEX',
  MATERIAL = 'MATERIAL',
  LOCAL_ANESTHETIC = 'LOCAL_ANESTHETIC',
  OTHER = 'OTHER',
}

export enum AllergySeverityDto {
  MILD = 'MILD',
  MODERATE = 'MODERATE',
  SEVERE = 'SEVERE',
}

export class RecordAllergyRequestDto {
  @IsEnum(AllergyTypeDto) type!: AllergyTypeDto;

  @IsString() @MinLength(1) @MaxLength(150) allergen!: string;

  @IsEnum(AllergySeverityDto) severity!: AllergySeverityDto;

  @IsOptional() @IsString() @MaxLength(1000) reaction?: string;

  @IsOptional() @IsString() @MaxLength(1000) notes?: string;

  @IsOptional() @IsUUID('4') visitId?: string;
}
