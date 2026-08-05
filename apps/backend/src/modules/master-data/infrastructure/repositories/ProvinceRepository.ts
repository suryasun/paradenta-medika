import { Province } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { IProvinceRepository } from '../../domain/repositories/IProvinceRepository';

export class ProvinceRepository implements IProvinceRepository {
  async list(): Promise<Province[]> {
    return prisma.province.findMany({ where: { isActive: true }, orderBy: { provinceName: 'asc' } });
  }

  async findById(id: string): Promise<Province | null> {
    return prisma.province.findUnique({ where: { id } });
  }
}
