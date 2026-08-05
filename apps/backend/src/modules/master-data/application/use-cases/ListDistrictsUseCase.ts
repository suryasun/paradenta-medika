import { District } from '@prisma/client';
import { IDistrictRepository } from '../../domain/repositories/IDistrictRepository';

export class ListDistrictsUseCase {
  constructor(private readonly districtRepository: IDistrictRepository) {}

  async execute(regencyId?: string): Promise<District[]> {
    return this.districtRepository.list(regencyId);
  }
}
