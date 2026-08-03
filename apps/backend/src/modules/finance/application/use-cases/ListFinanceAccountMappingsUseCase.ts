import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';
import { IFinanceAccountMappingRepository } from '../../domain/repositories/IFinanceAccountMappingRepository';
import { FinanceAccountMappingResponseDto } from '../dtos/FinanceAccountMappingResponseDto';
import { toFinanceAccountMappingResponseDto } from '../mappers/FinanceAccountMappingMapper';

export class ListFinanceAccountMappingsUseCase {
  constructor(private readonly accountMappingRepository: IFinanceAccountMappingRepository) {}

  async execute(query: ListQueryDto, branchId?: string): Promise<PagedResult<FinanceAccountMappingResponseDto>> {
    const result = await this.accountMappingRepository.list(query, { branchId });
    return { items: result.items.map(toFinanceAccountMappingResponseDto), total: result.total };
  }
}
