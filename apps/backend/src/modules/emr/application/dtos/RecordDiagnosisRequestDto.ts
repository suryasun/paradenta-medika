import { ArrayMinSize, IsArray } from 'class-validator';

export enum DiagnosisTypeDto {
  PRIMARY = 'PRIMARY',
  SECONDARY = 'SECONDARY',
  DIFFERENTIAL = 'DIFFERENTIAL',
}

export interface DiagnosisEntryDto {
  diagnosisType: DiagnosisTypeDto;
  diagnosisName: string;
  notes?: string;
}

/**
 * docs/03-sad/15-module-emr.md Section 21: "Minimal satu Primary Diagnosis."
 * Per-entry field validation (diagnosisType/diagnosisName shape) happens in
 * RecordDiagnosisUseCase rather than via class-validator's @ValidateNested/
 * @Type, which requires the `reflect-metadata` polyfill -- not an approved
 * dependency (docs/04-ai-contract/01-global-rules.md: no new library
 * without explicit approval).
 */
export class RecordDiagnosisRequestDto {
  @IsArray()
  @ArrayMinSize(1)
  diagnoses!: DiagnosisEntryDto[];
}
