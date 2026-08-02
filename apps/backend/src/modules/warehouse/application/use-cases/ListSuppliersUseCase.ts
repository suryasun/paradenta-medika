import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';
import { ISupplierRepository } from '../../domain/repositories/ISupplierRepository';
import { SupplierResponseDto } from '../dtos/SupplierResponseDto';
import { toSupplierResponseDto } from '../mappers/SupplierMapper';

export class ListSuppliersUseCase {
  constructor(private readonly supplierRepository: ISupplierRepository) {}

  async execute(query: ListQueryDto): Promise<PagedResult<SupplierResponseDto>> {
    const { items, total } = await this.supplierRepository.list(query);
    return { items: items.map(toSupplierResponseDto), total };
  }
}
