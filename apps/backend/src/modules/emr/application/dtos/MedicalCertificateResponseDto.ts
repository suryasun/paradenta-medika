export interface MedicalCertificateResponseDto {
  id: string;
  certificateNumber: string;
  visitId: string;
  patientId: string;
  doctorId: string;
  certificateType: string;
  content: string;
  issuedAt: string;
  attachmentId: string;
  createdAt: string;
  createdBy: string | null;
}
