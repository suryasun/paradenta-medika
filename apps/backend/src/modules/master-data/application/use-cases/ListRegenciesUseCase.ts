import { Regency } from '@prisma/client';
import { IRegencyRepository } from '../../domain/repositories/IRegencyRepository';

export class ListRegenciesUseCase {
  constructor(private readonly regencyRepository: IRegencyRepository) {}

  async execute(provinceId?: string): Promise<Regency[]> {
    return this.regencyRepository.list(provinceId);
  }
}
