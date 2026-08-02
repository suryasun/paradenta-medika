import { Referral } from '@prisma/client';
import { ReferralResponseDto } from '../dtos/ReferralResponseDto';

export function toReferralResponseDto(referral: Referral): ReferralResponseDto {
  return {
    id: referral.id,
    visitId: referral.visitId,
    patientId: referral.patientId,
    targetType: referral.targetType,
    reason: referral.reason,
    note: referral.note,
    createdAt: referral.createdAt.toISOString(),
    createdBy: referral.createdBy,
  };
}
