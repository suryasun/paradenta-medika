import { Regency } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { IRegencyRepository } from '../../domain/repositories/IRegencyRepository';

export class RegencyRepository implements IRegencyRepository {
  async list(provinceId?: string): Promise<Regency[]> {
    return prisma.regency.findMany({
      where: { isActive: true, ...(provinceId ? { provinceId } : {}) },
      orderBy: { regencyName: 'asc' },
    });
  }

  async findById(id: string): Promise<Regency | null> {
    return prisma.regency.findUnique({ where: { id } });
  }
}
