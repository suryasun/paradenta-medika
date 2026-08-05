import { Village } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { IVillageRepository } from '../../domain/repositories/IVillageRepository';

export class VillageRepository implements IVillageRepository {
  async list(districtId?: string): Promise<Village[]> {
    return prisma.village.findMany({
      where: { isActive: true, ...(districtId ? { districtId } : {}) },
      orderBy: { villageName: 'asc' },
    });
  }

  async findById(id: string): Promise<Village | null> {
    return prisma.village.findUnique({ where: { id } });
  }
}
