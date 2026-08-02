import { MedicalCertificate } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { CreateMedicalCertificateInput, IMedicalCertificateRepository } from '../../domain/repositories/IMedicalCertificateRepository';

export class MedicalCertificateRepository implements IMedicalCertificateRepository {
  async create(input: CreateMedicalCertificateInput): Promise<MedicalCertificate> {
    return prisma.medicalCertificate.create({
      data: {
        certificateNumber: input.certificateNumber,
        visitId: input.visitId,
        patientId: input.patientId,
        doctorId: input.doctorId,
        certificateType: input.certificateType,
        content: input.content,
        attachmentId: input.attachmentId,
        createdBy: input.createdBy,
      },
    });
  }

  async findById(id: string): Promise<MedicalCertificate | null> {
    return prisma.medicalCertificate.findUnique({ where: { id } });
  }

  async findByCertificateNumber(certificateNumber: string): Promise<MedicalCertificate | null> {
    return prisma.medicalCertificate.findUnique({ where: { certificateNumber } });
  }

  async findByPatientId(patientId: string): Promise<MedicalCertificate[]> {
    return prisma.medicalCertificate.findMany({ where: { patientId }, orderBy: { issuedAt: 'asc' } });
  }

  async count(): Promise<number> {
    return prisma.medicalCertificate.count();
  }
}
