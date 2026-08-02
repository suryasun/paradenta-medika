import { MedicalCertificate } from '@prisma/client';
import { MedicalCertificateResponseDto } from '../dtos/MedicalCertificateResponseDto';

export function toMedicalCertificateResponseDto(certificate: MedicalCertificate): MedicalCertificateResponseDto {
  return {
    id: certificate.id,
    certificateNumber: certificate.certificateNumber,
    visitId: certificate.visitId,
    patientId: certificate.patientId,
    doctorId: certificate.doctorId,
    certificateType: certificate.certificateType,
    content: certificate.content,
    issuedAt: certificate.issuedAt.toISOString(),
    attachmentId: certificate.attachmentId,
    createdAt: certificate.createdAt.toISOString(),
    createdBy: certificate.createdBy,
  };
}
