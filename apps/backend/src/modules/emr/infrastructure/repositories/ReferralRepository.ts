import { Referral } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { CreateReferralInput, IReferralRepository } from '../../domain/repositories/IReferralRepository';

export class ReferralRepository implements IReferralRepository {
  async create(input: CreateReferralInput): Promise<Referral> {
    return prisma.referral.create({
      data: {
        visitId: input.visitId,
        patientId: input.patientId,
        targetType: input.targetType,
        reason: input.reason,
        note: input.note,
        createdBy: input.createdBy,
      },
    });
  }

  async findByVisitId(visitId: string): Promise<Referral[]> {
    return prisma.referral.findMany({ where: { visitId }, orderBy: { createdAt: 'asc' } });
  }
}
