export interface PeriodontalMeasurementResponseDto {
  id: string;
  assessmentId: string;
  toothNumber: number;
  measurementPoint: string;
  pocketDepth: number;
  gingivalMargin: number;
  cal: number;
  bleeding: boolean;
  plaqueIndex: number | null;
  mobility: number | null;
  furcation: string | null;
  createdAt: string;
  createdBy: string | null;
}

export interface PeriodontalAssessmentResponseDto {
  id: string;
  visitId: string;
  patientId: string;
  doctorId: string;
  status: string;
  lockedAt: string | null;
  lockedBy: string | null;
  createdAt: string;
  createdBy: string | null;
}

export interface PeriodontalAssessmentDetailResponseDto extends PeriodontalAssessmentResponseDto {
  measurements: PeriodontalMeasurementResponseDto[];
}
