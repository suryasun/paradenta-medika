export interface ConsentResponseDto {
  id: string;
  templateId: string;
  patientId: string;
  visitId: string;
  doctorId: string;
  procedure: string;
  signedAt: string | null;
  signerName: string | null;
  signerRelationship: string | null;
  hash: string | null;
  signedAttachmentId: string | null;
  createdAt: string;
  createdBy: string | null;
}
