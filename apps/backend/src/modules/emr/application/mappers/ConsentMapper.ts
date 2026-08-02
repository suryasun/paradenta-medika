import { Consent } from '@prisma/client';
import { ConsentResponseDto } from '../dtos/ConsentResponseDto';

export function toConsentResponseDto(consent: Consent): ConsentResponseDto {
  return {
    id: consent.id,
    templateId: consent.templateId,
    patientId: consent.patientId,
    visitId: consent.visitId,
    doctorId: consent.doctorId,
    procedure: consent.procedure,
    signedAt: consent.signedAt ? consent.signedAt.toISOString() : null,
    signerName: consent.signerName,
    signerRelationship: consent.signerRelationship,
    hash: consent.hash,
    signedAttachmentId: consent.signedAttachmentId,
    createdAt: consent.createdAt.toISOString(),
    createdBy: consent.createdBy,
  };
}
