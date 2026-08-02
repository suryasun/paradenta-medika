import { AllergyResponseDto } from './AllergyResponseDto';
import { MedicalHistoryResponseDto } from './MedicalHistoryResponseDto';
import { PrescriptionResponseDto } from './PrescriptionResponseDto';
import { TreatmentPlanItemResponseDto } from './TreatmentPlanItemResponseDto';
import { VisitResponseDto } from './VisitResponseDto';

/**
 * docs/06-tasks/task-092.md Backend Scope literally names the four
 * highlights this DTO surfaces ("most recent visit, active allergies/
 * medical alerts, open treatment plan items, last prescription") -- not an
 * arbitrary invention, the field set is quoted directly from the task.
 */
export interface TimelineSummaryResponseDto {
  mostRecentVisit: VisitResponseDto | null;
  activeAlerts: {
    medicalHistory: MedicalHistoryResponseDto[];
    allergies: AllergyResponseDto[];
  };
  openTreatmentPlanItems: TreatmentPlanItemResponseDto[];
  lastPrescription: PrescriptionResponseDto | null;
}
