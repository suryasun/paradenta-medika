import { ReferralSource } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { IReferralSourceRepository } from '../../domain/repositories/IReferralSourceRepository';

export class ReferralSourceRepository implements IReferralSourceRepository {
  async list(): Promise<ReferralSource[]> {
    return prisma.referralSource.findMany({ where: { isActive: true }, orderBy: { referralSourceName: 'asc' } });
  }

  async findById(id: string): Promise<ReferralSource | null> {
    return prisma.referralSource.findUnique({ where: { id } });
  }
}
