import { OdontogramEntry } from '@prisma/client';
import { OdontogramEntryResponseDto } from '../dtos/OdontogramEntryResponseDto';

export function toOdontogramEntryResponseDto(entry: OdontogramEntry): OdontogramEntryResponseDto {
  return {
    id: entry.id,
    visitId: entry.visitId,
    patientId: entry.patientId,
    toothNumber: entry.toothNumber,
    surface: entry.surface,
    toothConditionId: entry.toothConditionId,
    note: entry.note,
    createdAt: entry.createdAt.toISOString(),
    createdBy: entry.createdBy,
  };
}
