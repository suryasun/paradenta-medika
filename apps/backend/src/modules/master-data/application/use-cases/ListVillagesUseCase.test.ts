import { Village } from '@prisma/client';
import { ListVillagesUseCase } from './ListVillagesUseCase';
import { IVillageRepository } from '../../domain/repositories/IVillageRepository';

function buildVillage(overrides: Partial<Village> = {}): Village {
  return {
    id: 'v1',
    districtId: 'd1',
    villageCode: 'GNDR',
    villageName: 'Gandaria Utara',
    postalCode: '12140',
    isActive: true,
    ...overrides,
  };
}

describe('ListVillagesUseCase', () => {
  it('passes the districtId filter through to the repository', async () => {
    const villages = [buildVillage()];
    const list = jest.fn().mockResolvedValue(villages);
    const repository: IVillageRepository = { list, findById: jest.fn() };
    const useCase = new ListVillagesUseCase(repository);

    const result = await useCase.execute('d1');

    expect(list).toHaveBeenCalledWith('d1');
    expect(result).toEqual(villages);
  });

  it('returns an empty list rather than erroring when districtId matches nothing', async () => {
    const repository: IVillageRepository = { list: jest.fn().mockResolvedValue([]), findById: jest.fn() };
    const useCase = new ListVillagesUseCase(repository);

    const result = await useCase.execute('non-existent-district');

    expect(result).toEqual([]);
  });
});
