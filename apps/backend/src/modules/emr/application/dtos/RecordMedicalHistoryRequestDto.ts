import { IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

/** Mirrors Prisma's MedicalHistoryCategory (docs/03-sad/15-module-emr.md Section 18). */
export enum MedicalHistoryCategoryDto {
  SYSTEMIC_DISEASE = 'SYSTEMIC_DISEASE',
  HEART_DISEASE = 'HEART_DISEASE',
  DIABETES = 'DIABETES',
  HYPERTENSION = 'HYPERTENSION',
  HEPATITIS = 'HEPATITIS',
  HIV = 'HIV',
  BLEEDING_DISORDER = 'BLEEDING_DISORDER',
  SURGERY_HISTORY = 'SURGERY_HISTORY',
  PREGNANCY = 'PREGNANCY',
  HOSPITALIZATION_HISTORY = 'HOSPITALIZATION_HISTORY',
}

export class RecordMedicalHistoryRequestDto {
  @IsEnum(MedicalHistoryCategoryDto) category!: MedicalHistoryCategoryDto;

  @IsString() @MinLength(1) @MaxLength(2000) description!: string;

  @IsOptional() @IsUUID('4') visitId?: string;
}
