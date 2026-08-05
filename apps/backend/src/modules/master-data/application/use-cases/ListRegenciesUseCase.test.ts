import { Regency } from '@prisma/client';
import { ListRegenciesUseCase } from './ListRegenciesUseCase';
import { IRegencyRepository } from '../../domain/repositories/IRegencyRepository';

function buildRegency(overrides: Partial<Regency> = {}): Regency {
  return { id: 'r1', provinceId: 'p1', regencyCode: 'JKT-SEL', regencyName: 'Jakarta Selatan', isActive: true, ...overrides };
}

describe('ListRegenciesUseCase', () => {
  it('passes the provinceId filter through to the repository', async () => {
    const regencies = [buildRegency()];
    const list = jest.fn().mockResolvedValue(regencies);
    const repository: IRegencyRepository = { list, findById: jest.fn() };
    const useCase = new ListRegenciesUseCase(repository);

    const result = await useCase.execute('p1');

    expect(list).toHaveBeenCalledWith('p1');
    expect(result).toEqual(regencies);
  });

  it('returns an empty list rather than erroring when provinceId matches nothing (repository behavior)', async () => {
    const repository: IRegencyRepository = { list: jest.fn().mockResolvedValue([]), findById: jest.fn() };
    const useCase = new ListRegenciesUseCase(repository);

    const result = await useCase.execute('non-existent-province');

    expect(result).toEqual([]);
  });

  it('lists every regency when no provinceId filter is given', async () => {
    const list = jest.fn().mockResolvedValue([]);
    const repository: IRegencyRepository = { list, findById: jest.fn() };
    const useCase = new ListRegenciesUseCase(repository);

    await useCase.execute();

    expect(list).toHaveBeenCalledWith(undefined);
  });
});
