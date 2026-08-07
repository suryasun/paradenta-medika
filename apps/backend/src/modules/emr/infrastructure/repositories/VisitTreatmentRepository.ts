import { VisitTreatment } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import {
  CreateVisitTreatmentInput,
  DoctorFeeSourceLine,
  IVisitTreatmentRepository,
  UpdateVisitTreatmentInput,
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

  async findById(id: string): Promise<VisitTreatment | null> {
    return prisma.visitTreatment.findFirst({ where: { id, deletedAt: null } });
  }

  async findByVisitId(visitId: string): Promise<VisitTreatment[]> {
    return prisma.visitTreatment.findMany({ where: { visitId, deletedAt: null }, orderBy: { createdAt: 'asc' } });
  }

  async findByVisitIdWithMaterials(visitId: string): Promise<VisitTreatmentWithMaterials[]> {
    return prisma.visitTreatment.findMany({
      where: { visitId, deletedAt: null },
      include: { materials: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async countByVisitId(visitId: string): Promise<number> {
    return prisma.visitTreatment.count({ where: { visitId, deletedAt: null } });
  }

  async update(id: string, input: UpdateVisitTreatmentInput): Promise<VisitTreatment> {
    return prisma.visitTreatment.update({
      where: { id },
      data: {
        toothReference: input.toothReference,
        quantity: input.quantity,
        unitPrice: input.unitPrice,
        subtotal: input.subtotal,
        notes: input.notes,
        updatedBy: input.updatedBy,
      },
    });
  }

  async softDelete(id: string, deletedBy: string): Promise<void> {
    await prisma.visitTreatment.update({ where: { id }, data: { deletedAt: new Date(), deletedBy } });
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
        deletedAt: null,
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
