import { Consent } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { CreateConsentInput, IConsentRepository, SignConsentInput } from '../../domain/repositories/IConsentRepository';

export class ConsentRepository implements IConsentRepository {
  async create(input: CreateConsentInput): Promise<Consent> {
    return prisma.consent.create({
      data: {
        templateId: input.templateId,
        patientId: input.patientId,
        visitId: input.visitId,
        doctorId: input.doctorId,
        procedure: input.procedure,
        createdBy: input.createdBy,
      },
    });
  }

  async findById(id: string): Promise<Consent | null> {
    return prisma.consent.findUnique({ where: { id } });
  }

  async findByPatientId(patientId: string): Promise<Consent[]> {
    return prisma.consent.findMany({ where: { patientId }, orderBy: { createdAt: 'asc' } });
  }

  async sign(id: string, input: SignConsentInput): Promise<Consent> {
    return prisma.consent.update({
      where: { id },
      data: {
        signedAt: new Date(),
        signerName: input.signerName,
        signerRelationship: input.signerRelationship,
        signatureData: input.signatureData,
        hash: input.hash,
        signedAttachmentId: input.signedAttachmentId,
      },
    });
  }
}
