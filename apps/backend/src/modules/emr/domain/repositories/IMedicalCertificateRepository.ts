import { MedicalCertificate, MedicalCertificateType } from '@prisma/client';

export interface CreateMedicalCertificateInput {
  certificateNumber: string;
  visitId: string;
  patientId: string;
  doctorId: string;
  certificateType: MedicalCertificateType;
  content: string;
  attachmentId: string;
  createdBy: string;
}

export interface IMedicalCertificateRepository {
  create(input: CreateMedicalCertificateInput): Promise<MedicalCertificate>;
  findById(id: string): Promise<MedicalCertificate | null>;
  findByCertificateNumber(certificateNumber: string): Promise<MedicalCertificate | null>;
  findByPatientId(patientId: string): Promise<MedicalCertificate[]>;
  count(): Promise<number>;
}
