import { IsEnum, IsString, MinLength } from 'class-validator';

/** docs/03-sad/15-module-emr.md Section 25 "Certificate Types". */
export enum MedicalCertificateTypeDto {
  FIT_TO_WORK = 'FIT_TO_WORK',
  SICK_LEAVE = 'SICK_LEAVE',
  MEDICAL_STATEMENT = 'MEDICAL_STATEMENT',
  DENTAL_TREATMENT_CERTIFICATE = 'DENTAL_TREATMENT_CERTIFICATE',
}

export class IssueMedicalCertificateRequestDto {
  @IsEnum(MedicalCertificateTypeDto) certificateType!: MedicalCertificateTypeDto;
  @IsString() @MinLength(1) content!: string;
}
