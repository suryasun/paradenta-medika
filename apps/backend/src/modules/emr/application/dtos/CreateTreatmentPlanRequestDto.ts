import { ArrayMinSize, IsArray } from 'class-validator';

export enum TreatmentPlanPriorityDto {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export interface TreatmentPlanItemEntryDto {
  treatmentId: string;
  toothNumber?: number;
  surface?: string;
  priority?: TreatmentPlanPriorityDto;
  estimatedCost: number;
  estimatedDurationMinute?: number;
}

/**
 * Per-entry field validation happens in CreateTreatmentPlanUseCase rather
 * than via class-validator's @ValidateNested/@Type, mirroring
 * RecordDiagnosisRequestDto's documented reason: @Type requires the
 * `reflect-metadata` polyfill, not an approved dependency.
 */
export class CreateTreatmentPlanRequestDto {
  @IsArray()
  @ArrayMinSize(1)
  items!: TreatmentPlanItemEntryDto[];
}
