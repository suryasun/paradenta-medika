import { TreatmentPlanItem } from '@prisma/client';
import { TreatmentPlanItemResponseDto } from '../dtos/TreatmentPlanItemResponseDto';

export function toTreatmentPlanItemResponseDto(item: TreatmentPlanItem): TreatmentPlanItemResponseDto {
  return {
    id: item.id,
    visitId: item.visitId,
    patientId: item.patientId,
    treatmentId: item.treatmentId,
    toothNumber: item.toothNumber,
    surface: item.surface,
    priority: item.priority,
    estimatedCost: Number(item.estimatedCost),
    estimatedDurationMinute: item.estimatedDurationMinute,
    createdAt: item.createdAt.toISOString(),
    createdBy: item.createdBy,
  };
}
