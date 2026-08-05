import { District } from '@prisma/client';
import { ListDistrictsUseCase } from './ListDistrictsUseCase';
import { IDistrictRepository } from '../../domain/repositories/IDistrictRepository';

function buildDistrict(overrides: Partial<District> = {}): District {
  return { id: 'd1', regencyId: 'r1', districtCode: 'KBY', districtName: 'Kebayoran Baru', isActive: true, ...overrides };
}

describe('ListDistrictsUseCase', () => {
  it('passes the regencyId filter through to the repository', async () => {
    const districts = [buildDistrict()];
    const list = jest.fn().mockResolvedValue(districts);
    const repository: IDistrictRepository = { list, findById: jest.fn() };
    const useCase = new ListDistrictsUseCase(repository);

    const result = await useCase.execute('r1');

    expect(list).toHaveBeenCalledWith('r1');
    expect(result).toEqual(districts);
  });

  it('returns an empty list rather than erroring when regencyId matches nothing', async () => {
    const repository: IDistrictRepository = { list: jest.fn().mockResolvedValue([]), findById: jest.fn() };
    const useCase = new ListDistrictsUseCase(repository);

    const result = await useCase.execute('non-existent-regency');

    expect(result).toEqual([]);
  });
});
