import { Province } from '@prisma/client';
import { IProvinceRepository } from '../../domain/repositories/IProvinceRepository';

export class ListProvincesUseCase {
  constructor(private readonly provinceRepository: IProvinceRepository) {}

  async execute(): Promise<Province[]> {
    return this.provinceRepository.list();
  }
}
