import { TreatmentPlanItem } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { CreateTreatmentPlanItemInput, ITreatmentPlanRepository } from '../../domain/repositories/ITreatmentPlanRepository';

export class TreatmentPlanRepository implements ITreatmentPlanRepository {
  async createMany(inputs: CreateTreatmentPlanItemInput[]): Promise<TreatmentPlanItem[]> {
    await prisma.treatmentPlanItem.createMany({
      data: inputs.map((input) => ({
        visitId: input.visitId,
        patientId: input.patientId,
        treatmentId: input.treatmentId,
        toothNumber: input.toothNumber,
        surface: input.surface,
        priority: input.priority ?? 'MEDIUM',
        estimatedCost: input.estimatedCost,
        estimatedDurationMinute: input.estimatedDurationMinute,
        createdBy: input.createdBy,
      })),
    });
    return this.findByVisitId(inputs[0]?.visitId ?? '');
  }

  async findById(id: string): Promise<TreatmentPlanItem | null> {
    return prisma.treatmentPlanItem.findUnique({ where: { id } });
  }

  async findByVisitId(visitId: string): Promise<TreatmentPlanItem[]> {
    return prisma.treatmentPlanItem.findMany({ where: { visitId }, orderBy: { createdAt: 'asc' } });
  }

  async findOpenByPatientId(patientId: string): Promise<TreatmentPlanItem[]> {
    return prisma.treatmentPlanItem.findMany({
      where: { patientId, reservations: { none: {} } },
      orderBy: { createdAt: 'asc' },
    });
  }
}
