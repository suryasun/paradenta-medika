import { FollowUp } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { CreateFollowUpInput, IFollowUpRepository } from '../../domain/repositories/IFollowUpRepository';

export class FollowUpRepository implements IFollowUpRepository {
  async create(input: CreateFollowUpInput): Promise<FollowUp> {
    return prisma.followUp.create({
      data: {
        visitId: input.visitId,
        patientId: input.patientId,
        followUpDate: input.followUpDate,
        note: input.note,
        priority: input.priority ?? 'MEDIUM',
        reservationId: input.reservationId,
        createdBy: input.createdBy,
      },
    });
  }

  async findByVisitId(visitId: string): Promise<FollowUp[]> {
    return prisma.followUp.findMany({ where: { visitId }, orderBy: { createdAt: 'asc' } });
  }
}
