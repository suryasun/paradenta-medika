import { Visit } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { CreateVisitInput, IVisitRepository } from '../../domain/repositories/IVisitRepository';

export class VisitRepository implements IVisitRepository {
  async create(input: CreateVisitInput): Promise<Visit> {
    return prisma.visit.create({
      data: {
        visitNo: input.visitNo,
        reservationId: input.reservationId,
        patientId: input.patientId,
        doctorId: input.doctorId,
        branchId: input.branchId,
        queueId: input.queueId,
        visitDate: new Date(),
        chiefComplaint: input.chiefComplaint,
        createdBy: input.createdBy,
      },
    });
  }

  async findById(id: string): Promise<Visit | null> {
    return prisma.visit.findFirst({ where: { id, deletedAt: null } });
  }

  async findByQueueId(queueId: string): Promise<Visit | null> {
    return prisma.visit.findFirst({ where: { queueId, deletedAt: null } });
  }

  async findByVisitNo(visitNo: string): Promise<Visit | null> {
    return prisma.visit.findFirst({ where: { visitNo } });
  }

  async findByPatientId(patientId: string): Promise<Visit[]> {
    return prisma.visit.findMany({ where: { patientId, deletedAt: null }, orderBy: { visitDate: 'asc' } });
  }

  async count(): Promise<number> {
    return prisma.visit.count();
  }

  async markCompleted(id: string, updatedBy: string): Promise<Visit> {
    return prisma.visit.update({
      where: { id },
      data: { status: 'COMPLETED', finishedAt: new Date(), updatedBy },
    });
  }
}
