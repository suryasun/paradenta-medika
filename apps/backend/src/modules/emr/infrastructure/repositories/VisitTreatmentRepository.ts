import { VisitTreatment } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { CreateVisitTreatmentInput, IVisitTreatmentRepository } from '../../domain/repositories/IVisitTreatmentRepository';

export class VisitTreatmentRepository implements IVisitTreatmentRepository {
  async create(input: CreateVisitTreatmentInput): Promise<VisitTreatment> {
    return prisma.visitTreatment.create({
      data: {
        visitId: input.visitId,
        treatmentId: input.treatmentId,
        toothReference: input.toothReference,
        quantity: input.quantity,
        unitPrice: input.unitPrice,
        subtotal: input.subtotal,
        notes: input.notes,
        createdBy: input.createdBy,
      },
    });
  }

  async findByVisitId(visitId: string): Promise<VisitTreatment[]> {
    return prisma.visitTreatment.findMany({ where: { visitId }, orderBy: { createdAt: 'asc' } });
  }

  async countByVisitId(visitId: string): Promise<number> {
    return prisma.visitTreatment.count({ where: { visitId } });
  }
}
