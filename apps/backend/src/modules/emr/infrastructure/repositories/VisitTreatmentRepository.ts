import { VisitTreatment } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import {
  CreateVisitTreatmentInput,
  DoctorFeeSourceLine,
  IVisitTreatmentRepository,
  VisitTreatmentWithMaterials,
} from '../../domain/repositories/IVisitTreatmentRepository';

const FINALIZED_VISIT_STATUSES = ['COMPLETED', 'LOCKED', 'ARCHIVED'] as const;

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
        materials:
          input.materials && input.materials.length > 0
            ? { create: input.materials.map((m) => ({ itemId: m.itemId, quantity: m.quantity, createdBy: input.createdBy })) }
            : undefined,
      },
    });
  }

  async findByVisitId(visitId: string): Promise<VisitTreatment[]> {
    return prisma.visitTreatment.findMany({ where: { visitId }, orderBy: { createdAt: 'asc' } });
  }

  async findByVisitIdWithMaterials(visitId: string): Promise<VisitTreatmentWithMaterials[]> {
    return prisma.visitTreatment.findMany({
      where: { visitId },
      include: { materials: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async countByVisitId(visitId: string): Promise<number> {
    return prisma.visitTreatment.count({ where: { visitId } });
  }

  async findUnsettledDoctorFeeSources(
    doctorId: string,
    branchId: string,
    periodStart: Date,
    periodEnd: Date,
    excludeVisitTreatmentIds: string[],
  ): Promise<DoctorFeeSourceLine[]> {
    const rows = await prisma.visitTreatment.findMany({
      where: {
        id: excludeVisitTreatmentIds.length ? { notIn: excludeVisitTreatmentIds } : undefined,
        treatment: { doctorFee: { gt: 0 } },
        visit: {
          doctorId,
          branchId,
          status: { in: [...FINALIZED_VISIT_STATUSES] },
          visitDate: { gte: periodStart, lte: periodEnd },
        },
      },
      include: { treatment: true, visit: true },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map((row) => {
      const doctorFee = Number(row.treatment.doctorFee);
      return {
        visitTreatmentId: row.id,
        visitId: row.visitId,
        treatmentId: row.treatmentId,
        quantity: Number(row.quantity),
        doctorFee,
        amount: doctorFee * Number(row.quantity),
        visitDate: row.visit.visitDate,
      };
    });
  }
}
