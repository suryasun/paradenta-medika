import { FollowUp } from '@prisma/client';
import { FollowUpResponseDto } from '../dtos/FollowUpResponseDto';

export function toFollowUpResponseDto(followUp: FollowUp): FollowUpResponseDto {
  return {
    id: followUp.id,
    visitId: followUp.visitId,
    patientId: followUp.patientId,
    followUpDate: followUp.followUpDate.toISOString().slice(0, 10),
    note: followUp.note,
    priority: followUp.priority,
    reservationId: followUp.reservationId,
    createdAt: followUp.createdAt.toISOString(),
    createdBy: followUp.createdBy,
  };
}
