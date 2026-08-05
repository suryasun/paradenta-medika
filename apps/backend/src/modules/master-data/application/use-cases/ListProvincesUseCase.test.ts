import { Province } from '@prisma/client';
import { ListProvincesUseCase } from './ListProvincesUseCase';
import { IProvinceRepository } from '../../domain/repositories/IProvinceRepository';

function buildProvince(overrides: Partial<Province> = {}): Province {
  return { id: 'p1', provinceCode: 'DKI', provinceName: 'DKI Jakarta', isActive: true, ...overrides };
}

describe('ListProvincesUseCase', () => {
  it('returns every province from the repository', async () => {
    const provinces = [buildProvince(), buildProvince({ id: 'p2', provinceCode: 'JABAR', provinceName: 'Jawa Barat' })];
    const repository: IProvinceRepository = { list: jest.fn().mockResolvedValue(provinces), findById: jest.fn() };
    const useCase = new ListProvincesUseCase(repository);

    const result = await useCase.execute();

    expect(result).toEqual(provinces);
  });
});
