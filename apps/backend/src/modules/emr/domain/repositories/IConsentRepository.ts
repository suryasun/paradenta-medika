import { Consent, ConsentSignerRelationship } from '@prisma/client';

export interface CreateConsentInput {
  templateId: string;
  patientId: string;
  visitId: string;
  doctorId: string;
  procedure: string;
  createdBy: string;
}

export interface SignConsentInput {
  signerName: string;
  signerRelationship: ConsentSignerRelationship;
  signatureData: string;
  hash: string;
  signedAttachmentId: string;
}

export interface IConsentRepository {
  create(input: CreateConsentInput): Promise<Consent>;
  findById(id: string): Promise<Consent | null>;
  findByPatientId(patientId: string): Promise<Consent[]>;
  sign(id: string, input: SignConsentInput): Promise<Consent>;
}
