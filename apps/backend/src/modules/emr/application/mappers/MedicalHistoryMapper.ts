import { MedicalHistory } from '@prisma/client';
import { MedicalHistoryResponseDto } from '../dtos/MedicalHistoryResponseDto';

export function toMedicalHistoryResponseDto(entry: MedicalHistory): MedicalHistoryResponseDto {
  return {
    id: entry.id,
    patientId: entry.patientId,
    visitId: entry.visitId,
    category: entry.category,
    description: entry.description,
    isActive: entry.isActive,
    createdAt: entry.createdAt.toISOString(),
    createdBy: entry.createdBy,
  };
}
