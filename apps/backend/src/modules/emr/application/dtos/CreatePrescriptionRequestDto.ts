import { ArrayMinSize, IsArray } from 'class-validator';

export interface PrescriptionItemEntryDto {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instruction?: string;
}

/**
 * Per-entry field validation happens in CreatePrescriptionUseCase rather
 * than via class-validator's @ValidateNested/@Type, mirroring
 * RecordDiagnosisRequestDto/CreateTreatmentPlanRequestDto's documented
 * reason: @Type requires the `reflect-metadata` polyfill, not an approved
 * dependency.
 */
export class CreatePrescriptionRequestDto {
  @IsArray()
  @ArrayMinSize(1)
  items!: PrescriptionItemEntryDto[];
}
