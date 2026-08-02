import { PeriodontalAssessment } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import {
  CreatePeriodontalAssessmentInput,
  IPeriodontalAssessmentRepository,
} from '../../domain/repositories/IPeriodontalAssessmentRepository';

export class PeriodontalAssessmentRepository implements IPeriodontalAssessmentRepository {
  async create(input: CreatePeriodontalAssessmentInput): Promise<PeriodontalAssessment> {
    return prisma.periodontalAssessment.create({
      data: {
        visitId: input.visitId,
        patientId: input.patientId,
        doctorId: input.doctorId,
        createdBy: input.createdBy,
      },
    });
  }

  async findById(id: string): Promise<PeriodontalAssessment | null> {
    return prisma.periodontalAssessment.findUnique({ where: { id } });
  }

  async findByPatientId(patientId: string): Promise<PeriodontalAssessment[]> {
    return prisma.periodontalAssessment.findMany({ where: { patientId }, orderBy: { createdAt: 'asc' } });
  }

  async lock(id: string, lockedBy: string): Promise<PeriodontalAssessment> {
    return prisma.periodontalAssessment.update({
      where: { id },
      data: { status: 'LOCKED', lockedAt: new Date(), lockedBy, updatedBy: lockedBy },
    });
  }
}
