import { Village } from '@prisma/client';
import { IVillageRepository } from '../../domain/repositories/IVillageRepository';

export class ListVillagesUseCase {
  constructor(private readonly villageRepository: IVillageRepository) {}

  async execute(districtId?: string): Promise<Village[]> {
    return this.villageRepository.list(districtId);
  }
}
