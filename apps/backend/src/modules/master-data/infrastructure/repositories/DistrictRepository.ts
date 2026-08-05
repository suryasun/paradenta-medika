import { District } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { IDistrictRepository } from '../../domain/repositories/IDistrictRepository';

export class DistrictRepository implements IDistrictRepository {
  async list(regencyId?: string): Promise<District[]> {
    return prisma.district.findMany({
      where: { isActive: true, ...(regencyId ? { regencyId } : {}) },
      orderBy: { districtName: 'asc' },
    });
  }

  async findById(id: string): Promise<District | null> {
    return prisma.district.findUnique({ where: { id } });
  }
}
