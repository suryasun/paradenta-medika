import { MedicalHistory, MedicalHistoryCategory } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { CreateMedicalHistoryInput, IMedicalHistoryRepository } from '../../domain/repositories/IMedicalHistoryRepository';

export class MedicalHistoryRepository implements IMedicalHistoryRepository {
  async create(input: CreateMedicalHistoryInput): Promise<MedicalHistory> {
    return prisma.medicalHistory.create({
      data: {
        patientId: input.patientId,
        visitId: input.visitId,
        category: input.category,
        description: input.description,
        isActive: true,
        createdBy: input.createdBy,
      },
    });
  }

  async deactivateByCategory(patientId: string, category: MedicalHistoryCategory): Promise<void> {
    await prisma.medicalHistory.updateMany({
      where: { patientId, category, isActive: true },
      data: { isActive: false },
    });
  }

  async findActiveByPatientId(patientId: string): Promise<MedicalHistory[]> {
    return prisma.medicalHistory.findMany({
      where: { patientId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllByPatientId(patientId: string): Promise<MedicalHistory[]> {
    return prisma.medicalHistory.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
