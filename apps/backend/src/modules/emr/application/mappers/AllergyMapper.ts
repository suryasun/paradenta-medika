import { Allergy } from '@prisma/client';
import { AllergyResponseDto } from '../dtos/AllergyResponseDto';

export function toAllergyResponseDto(entry: Allergy): AllergyResponseDto {
  return {
    id: entry.id,
    patientId: entry.patientId,
    visitId: entry.visitId,
    type: entry.type,
    allergen: entry.allergen,
    severity: entry.severity,
    reaction: entry.reaction,
    notes: entry.notes,
    createdAt: entry.createdAt.toISOString(),
    createdBy: entry.createdBy,
  };
}
